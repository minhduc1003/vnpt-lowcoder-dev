package org.lowcoder.domain.permission.service;

import com.google.common.collect.HashMultimap;
import com.google.common.collect.Multimap;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.apache.commons.collections4.CollectionUtils;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.permission.model.*;
import org.lowcoder.infra.annotation.NonEmptyMono;
import org.lowcoder.infra.annotation.PossibleEmptyMono;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.Map.Entry;

import static java.util.Collections.singleton;
import static org.apache.commons.collections4.SetUtils.emptyIfNull;
import static org.lowcoder.sdk.exception.BizError.INVALID_PERMISSION_OPERATION;
import static org.lowcoder.sdk.exception.BizError.NOT_AUTHORIZED;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;
import static org.lowcoder.sdk.util.ExceptionUtils.ofException;

@RequiredArgsConstructor
@Service
public class ResourcePermissionServiceImpl implements ResourcePermissionService {

    private final ResourcePermissionRepository repository;
    @Qualifier("applicationPermissionHandler")
    private final ResourcePermissionHandlerService applicationPermissionHandler;
    @Qualifier("datasourcePermissionHandler")
    private final ResourcePermissionHandlerService datasourcePermissionHandler;
    @Qualifier("bundlePermissionHandler")
    private final ResourcePermissionHandlerService bundlePermissionHandler;

    @Override
    public Mono<Map<String, Collection<ResourcePermission>>> getByResourceTypeAndResourceIds(ResourceType resourceType,
                                                                                             Collection<String> resourceIds) {
        return repository.getByResourceTypeAndResourceIds(resourceType, resourceIds);
    }

    @Override
    @NonEmptyMono
    public Mono<List<ResourcePermission>> getByResourceTypeAndResourceId(ResourceType resourceType, String resourceId) {
        return repository.getByResourceTypeAndResourceId(resourceType, resourceId);
    }

    @Override
    @NonEmptyMono
    public Mono<List<ResourcePermission>> getByApplicationId(String applicationId) {
        return getByResourceTypeAndResourceId(ResourceType.APPLICATION, applicationId);
    }

    @Override
    @NonEmptyMono
    public Mono<List<ResourcePermission>> getByBundleId(String bundleId) {
        return getByResourceTypeAndResourceId(ResourceType.BUNDLE, bundleId);
    }

    @Override
    @NonEmptyMono
    public Mono<List<ResourcePermission>> getByDataSourceId(String dataSourceId) {
        return getByResourceTypeAndResourceId(ResourceType.DATASOURCE, dataSourceId);
    }

    @Override
    public Mono<Void> insertBatchPermission(ResourceType resourceType, String resourceId, @Nullable Set<String> userIds,
                                            @Nullable Set<String> groupIds, ResourceRole role) {
        if (CollectionUtils.isEmpty(userIds) && CollectionUtils.isEmpty(groupIds)) {
            return Mono.empty();
        }
        return repository.insertBatchPermission(resourceType, resourceId, buildResourceHolders(emptyIfNull(userIds), emptyIfNull(groupIds)), role);
    }

    private Multimap<ResourceHolder, String> buildResourceHolders(@NotNull Set<String> userIds, @NotNull Set<String> groupIds) {
        HashMultimap<ResourceHolder, String> result = HashMultimap.create();
        for (String userId : userIds) {
            result.put(ResourceHolder.USER, userId);
        }
        for (String groupId : groupIds) {
            result.put(ResourceHolder.GROUP, groupId);
        }
        return result;
    }

    @SuppressWarnings("SameParameterValue")
    Mono<Boolean> addPermission(ResourceType resourceType, String resourceId,
            ResourceHolder holderType, String holderId,
            ResourceRole resourceRole) {
        return repository.addPermission(resourceType, resourceId, holderType, holderId, resourceRole);
    }

    @Override
    public Mono<Boolean> addDataSourcePermissionToUser(String dataSourceId,
                                                       String userId,
                                                       ResourceRole role) {
        return addPermission(ResourceType.DATASOURCE, dataSourceId, ResourceHolder.USER, userId, role);
    }

    @Override
    public Mono<Boolean> addResourcePermissionToUser(String resourceId,
                                                        String userId,
                                                        ResourceRole role,
                                                        ResourceType type) {
        return addPermission(type, resourceId, ResourceHolder.USER, userId, role);
    }

    @Override
    public Mono<Boolean> addApplicationPermissionToGroup(String applicationId,
                                                         String groupId,
                                                         ResourceRole role) {
        return addPermission(ResourceType.APPLICATION, applicationId, ResourceHolder.GROUP, groupId, role);
    }

    @Override
    public Mono<ResourcePermission> getById(String permissionId) {
        return repository.getById(permissionId);
    }

    @Override
    public Mono<Boolean> removeById(String permissionId) {
        return repository.removePermissionById(permissionId);
    }

    @Override
    public Mono<Boolean> updateRoleById(String permissionId, ResourceRole role) {
        return repository.updatePermissionRoleById(permissionId, role);
    }

    /**
     * @return map key: resourceId, value: all permissions user have for this resource
     */
    private Mono<Map<String, List<ResourcePermission>>> getAllMatchingPermissions(String userId,
            Collection<String> resourceIds,
            ResourceAction resourceAction) {
        ResourceType resourceType = resourceAction.getResourceType();
        var resourcePermissionHandler = getResourcePermissionHandler(resourceType);
        return resourcePermissionHandler.getAllMatchingPermissions(userId, resourceIds, resourceAction);
    }

    private ResourcePermissionHandlerService getResourcePermissionHandler(ResourceType resourceType) {
        if (resourceType == ResourceType.DATASOURCE) {
            return datasourcePermissionHandler;
        }

        if (resourceType == ResourceType.APPLICATION) {
            return applicationPermissionHandler;
        }

        if (resourceType == ResourceType.BUNDLE) {
            return bundlePermissionHandler;
        }

        throw ofException(INVALID_PERMISSION_OPERATION, "INVALID_PERMISSION_OPERATION", resourceType);
    }

    @Override
    public Flux<String> filterResourceWithPermission(String userId, Collection<String> resourceIds, ResourceAction resourceAction) {
        return getAllMatchingPermissions(userId, resourceIds, resourceAction)
                .flatMapIterable(Map::entrySet)
                .filter(entry -> CollectionUtils.isNotEmpty(entry.getValue()))
                .map(Entry::getKey);
    }

    @Override
    public Mono<Void> checkResourcePermissionWithError(String userId, String resourceId, ResourceAction action) {
        return getAllMatchingPermissions(userId, singleton(resourceId), action)
                .flatMap(map -> {
                    List<ResourcePermission> resourcePermissions = map.get(resourceId);
                    if (CollectionUtils.isNotEmpty(resourcePermissions)) {
                        return Mono.empty();
                    }
                    return Mono.error(new BizException(NOT_AUTHORIZED, "NOT_AUTHORIZED"));
                });
    }

    @Override
    @PossibleEmptyMono
    public Mono<ResourcePermission> getMaxMatchingPermission(String userId, String resourceId, ResourceAction resourceAction) {
        return getMaxMatchingPermission(userId, Collections.singleton(resourceId), resourceAction)
                .flatMap(map -> {
                    ResourcePermission resourcePermission = map.get(resourceId);
                    if (resourcePermission == null) {
                        return Mono.empty();
                    }
                    return Mono.just(resourcePermission);
                });
    }

    /**
     * If current user has enough permissions for all resources.
     */
    @Override
    public Mono<Boolean> haveAllEnoughPermissions(String userId, Collection<String> resourceIds, ResourceAction resourceAction) {
        return getMaxMatchingPermission(userId, resourceIds, resourceAction)
                .map(map -> map.keySet().containsAll(resourceIds));
    }

    @Override
    public Mono<Map<String, ResourcePermission>> getMaxMatchingPermission(String userId,
                                                                          Collection<String> resourceIds, ResourceAction resourceAction) {
        return getAllMatchingPermissions(userId, resourceIds, resourceAction)
                .flatMapIterable(Map::entrySet)
                .filter(it -> CollectionUtils.isNotEmpty(it.getValue()))
                .collectMap(Entry::getKey, entry -> getMaxRole(entry.getValue()));
    }

    @SuppressWarnings("OptionalGetWithoutIsPresent")
    private ResourcePermission getMaxRole(List<ResourcePermission> permissions) {
        return permissions.stream()
                .max(Comparator.comparingInt(it -> it.getResourceRole().getRoleWeight()))
                .get();
    }

    @Override
    public Mono<ResourcePermission> checkAndReturnMaxPermission(String userId, String resourceId, ResourceAction resourceAction) {
        return getMaxMatchingPermission(userId, Collections.singleton(resourceId), resourceAction)
                .flatMap(permissionMap -> {
                    if (!permissionMap.containsKey(resourceId)) {
                        return ofError(NOT_AUTHORIZED, "NOT_AUTHORIZED");
                    }
                    return Mono.just(permissionMap.get(resourceId));
                });
    }

    @Override
    public Mono<UserPermissionOnResourceStatus> checkUserPermissionStatusOnResource
            (String userId, String resourceId, ResourceAction resourceAction) {
        ResourceType resourceType = resourceAction.getResourceType();
        var resourcePermissionHandler = getResourcePermissionHandler(resourceType);
        return resourcePermissionHandler.checkUserPermissionStatusOnResource(userId, resourceId, resourceAction);
    }

    @Override
    public Mono<UserPermissionOnResourceStatus> checkUserPermissionStatusOnApplication
            (String userId, String resourceId, ResourceAction resourceAction, ApplicationRequestType requestType) {
		ResourceType resourceType = resourceAction.getResourceType();
		var resourcePermissionHandler = getResourcePermissionHandler(resourceType);
		return resourcePermissionHandler.checkUserPermissionStatusOnApplication(userId, resourceId, resourceAction, requestType);
    }

    @Override
    public Mono<UserPermissionOnResourceStatus> checkUserPermissionStatusOnBundle
            (String userId, String resourceId, ResourceAction resourceAction, BundleRequestType requestType) {
        ResourceType resourceType = resourceAction.getResourceType();
        var resourcePermissionHandler = getResourcePermissionHandler(resourceType);
        return resourcePermissionHandler.checkUserPermissionStatusOnBundle(userId, resourceId, resourceAction, requestType);
    }
    
    
    @Override
    public Mono<Boolean> removeUserApplicationPermission(String appId, String userId) {
        return repository.removePermissionBy(ResourceType.APPLICATION, appId, ResourceHolder.USER, userId);
    }

    @Override
    public Mono<Boolean> removeUserDatasourcePermission(String appId, String userId) {
        return repository.removePermissionBy(ResourceType.APPLICATION, appId, ResourceHolder.USER, userId);
    }

    @Override
    public Mono<ResourcePermission> getUserAssignedPermissionForApplication(String applicationId, String userId) {
        return repository.getByResourceTypeAndResourceIdAndTargetId(ResourceType.APPLICATION,
                applicationId, ResourceHolder.USER, userId);
    }
}
