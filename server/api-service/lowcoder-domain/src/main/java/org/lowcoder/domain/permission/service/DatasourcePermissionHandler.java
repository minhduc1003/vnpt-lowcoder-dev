package org.lowcoder.domain.permission.service;

import com.google.common.collect.Maps;
import lombok.RequiredArgsConstructor;
import org.apache.commons.collections4.CollectionUtils;
import org.lowcoder.domain.application.model.ApplicationRequestType;
import org.lowcoder.domain.bundle.model.BundleRequestType;
import org.lowcoder.domain.datasource.model.Datasource;
import org.lowcoder.domain.datasource.service.DatasourceService;
import org.lowcoder.domain.permission.model.ResourceAction;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.model.ResourceType;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.lowcoder.domain.permission.model.ResourceHolder.USER;

@RequiredArgsConstructor
@Component
class DatasourcePermissionHandler extends ResourcePermissionHandler {

    private static final ResourceRole SYSTEM_STATIC_DATASOURCE_USER_ROLE = ResourceRole.OWNER;

    private final DatasourceService datasourceService;

    @Override
    protected Mono<Map<String, List<ResourcePermission>>> getAnonymousUserPermissions(Collection<String> resourceIds, ResourceAction resourceAction) {
        return Mono.just(Collections.emptyMap());
    }

    @Override
    protected Mono<Map<String, List<ResourcePermission>>> getNonAnonymousUserPublicResourcePermissions(Collection<String> resourceIds, ResourceAction resourceAction, String userId) {
        return Mono.just(Collections.emptyMap());
    }

    @Override
	protected Mono<Map<String, List<ResourcePermission>>> getAnonymousUserApplicationPermissions(
			Collection<String> resourceIds, ResourceAction resourceAction, ApplicationRequestType requestType) {
        return Mono.just(Collections.emptyMap());
	}

	@Override
	protected Mono<Map<String, List<ResourcePermission>>> getNonAnonymousUserApplicationPublicResourcePermissions(
			Collection<String> resourceIds, ResourceAction resourceAction, ApplicationRequestType requestType, String userId) {
        return Mono.just(Collections.emptyMap());
	}

    @Override
    protected Mono<Map<String, List<ResourcePermission>>> getAnonymousUserBundlePermissions(Collection<String> resourceIds, ResourceAction resourceAction, BundleRequestType requestType) {
        return Mono.just(Collections.emptyMap());
    }

    @Override
    protected Mono<Map<String, List<ResourcePermission>>> getNonAnonymousUserBundlePublicResourcePermissions(Collection<String> resourceIds, ResourceAction resourceAction, BundleRequestType requestType, String userId) {
        return Mono.just(Collections.emptyMap());
    }

    @Override
    protected Mono<String> getOrgId(String resourceId) {
        return datasourceService.getById(resourceId)
                .map(Datasource::getOrganizationId);
    }

    @Override
    public Mono<Map<String, List<ResourcePermission>>> getAllMatchingPermissions(String userId, Collection<String> resourceIds,
            ResourceAction resourceAction) {

        List<String> systemStaticDatasourceIds = resourceIds.stream()
                .filter(Datasource::isSystemStaticId)
                .distinct()
                .toList();
        List<String> nonSystemStaticDatasourceIds = resourceIds.stream()
                .filter(Datasource::isNotSystemStaticId)
                .distinct()
                .toList();

        if (CollectionUtils.isEmpty(systemStaticDatasourceIds)) {
            return super.getAllMatchingPermissions(userId, nonSystemStaticDatasourceIds, resourceAction);
        }
        return super.getAllMatchingPermissions(userId, nonSystemStaticDatasourceIds, resourceAction)
                .map(allMatchingPermissions -> {
                    Map<String, List<ResourcePermission>> result = Maps.newHashMap();
                    Map<String, List<ResourcePermission>> systemStaticDatasourcePermissions = systemStaticDatasourceIds.stream()
                            .collect(Collectors.toMap(Function.identity(), id -> getSystemStaticDatasourcePermission(userId, id)));
                    result.putAll(systemStaticDatasourcePermissions);
                    result.putAll(allMatchingPermissions);
                    return result;
                });
    }

    private List<ResourcePermission> getSystemStaticDatasourcePermission(String userId, String datasourceId) {
        return Collections.singletonList(ResourcePermission.builder()
                .resourceId(datasourceId)
                .resourceType(ResourceType.DATASOURCE)
                .resourceHolder(USER)
                .resourceHolderId(userId)
                .resourceRole(SYSTEM_STATIC_DATASOURCE_USER_ROLE)
                .build());
    }
}
