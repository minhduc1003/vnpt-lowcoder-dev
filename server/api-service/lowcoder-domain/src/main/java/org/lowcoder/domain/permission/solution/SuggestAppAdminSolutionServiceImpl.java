package org.lowcoder.domain.permission.solution;

import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import org.lowcoder.domain.group.model.GroupMember;
import org.lowcoder.domain.group.service.GroupMemberService;
import org.lowcoder.domain.permission.model.ResourcePermission;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.domain.permission.service.ResourcePermissionService;
import org.lowcoder.domain.user.model.User;
import org.lowcoder.domain.user.service.UserService;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import static com.google.common.collect.Lists.newArrayList;
import static com.google.common.collect.Sets.newHashSet;

@RequiredArgsConstructor
@Service
public class SuggestAppAdminSolutionServiceImpl implements SuggestAppAdminSolutionService {

    private static final int LIMIT_COUNT_FOR_DISPLAY_ADMIN_NAMES = 7;

    private final GroupMemberService groupMemberService;
    private final UserService userService;
    private final ResourcePermissionService resourcePermissionService;

    @Override
    public Mono<List<User>> getApplicationAdminUsers(String applicationId, int limit) {
        return resourcePermissionService.getByApplicationId(applicationId)
                .flatMap(permissions -> getSuggestAdminIds(limit, permissions))
                .flatMap(userIds -> userService.getByIds(userIds)
                        .map(mapData -> userIds.stream()
                                .map(mapData::get)
                                .filter(Objects::nonNull)
                                .toList()
                        )
                );
    }

    @Nonnull
    private Mono<List<String>> getSuggestAdminIds(int limit, List<ResourcePermission> permissions) {
        List<String> adminUserIds = permissions.stream()
                .filter(it -> it.ownedByUser() && it.getResourceRole() == ResourceRole.OWNER)
                .map(ResourcePermission::getResourceHolderId)
                .toList();
        List<String> adminGroupIds = permissions.stream()
                .filter(it -> it.ownedByGroup() && it.getResourceRole() == ResourceRole.OWNER)
                .map(ResourcePermission::getResourceHolderId)
                .toList();

        if (adminUserIds.size() >= limit) {
            return Mono.just(adminUserIds.stream()
                    .limit(limit)
                    .toList());
        }

        Set<String> adminUserIdSet = newHashSet(adminUserIds);
        return Flux.fromIterable(adminGroupIds)
                .flatMap(groupId -> groupMemberService.getGroupMembers(groupId, 1, 100))
                .flatMapIterable(list -> list)
                .map(GroupMember::getUserId)
                .filter(it -> !adminUserIdSet.contains(it))
                .take(limit - adminUserIds.size())
                .collectList()
                .map(groupUserIds -> {
                    List<String> userIds = newArrayList();
                    userIds.addAll(adminUserIds);
                    userIds.addAll(groupUserIds);
                    return userIds;
                });
    }

    @Override
    public Mono<String> getSuggestAppAdminNames(String applicationId) {
        return getApplicationAdminUsers(applicationId, LIMIT_COUNT_FOR_DISPLAY_ADMIN_NAMES)
                .map(users -> users.stream()
                        .map(User::getName)
                        .collect(Collectors.joining(" "))
                );
    }

}
