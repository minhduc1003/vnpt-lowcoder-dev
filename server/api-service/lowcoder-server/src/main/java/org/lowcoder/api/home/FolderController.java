package org.lowcoder.api.home;

import static org.lowcoder.plugin.api.event.LowcoderEvent.EventType.APPLICATION_MOVE;
import static org.lowcoder.sdk.exception.BizError.INVALID_PARAMETER;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

import java.util.List;

import org.lowcoder.api.application.view.ApplicationPermissionView;
import org.lowcoder.api.framework.view.ResponseView;
import org.lowcoder.api.util.BusinessEventPublisher;
import org.lowcoder.api.util.GidService;
import org.lowcoder.domain.application.model.ApplicationType;
import org.lowcoder.domain.folder.model.Folder;
import org.lowcoder.domain.folder.service.FolderService;
import org.lowcoder.domain.permission.model.ResourceRole;
import org.lowcoder.plugin.api.event.LowcoderEvent.EventType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@RestController
public class FolderController implements FolderEndpoints 
{

    private final FolderService folderService;
    private final FolderApiService folderApiService;
    private final BusinessEventPublisher businessEventPublisher;
    private final GidService gidService;

    @Override
    public Mono<ResponseView<FolderInfoView>> create(@RequestBody Folder folder) {
        return folderApiService.create(folder)
                .delayUntil(folderInfoView -> folderApiService.upsertLastViewTime(folderInfoView.getFolderId()))
                .delayUntil(f -> businessEventPublisher.publishFolderCommonEvent(f.getFolderId(), f.getName(), EventType.FOLDER_CREATE))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Void>> delete(@PathVariable("id") String folderId) {
        String objectId = gidService.convertFolderIdToObjectId(folderId);
        return folderApiService.delete(objectId)
                .delayUntil(f -> businessEventPublisher.publishFolderCommonEvent(f.getId(), f.getName(), EventType.FOLDER_DELETE))
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    /**
     * update name only.
     */
    @Override
    public Mono<ResponseView<FolderInfoView>> update(@RequestBody Folder folder) {
        return folderService.findById(folder.getId())
                .zipWhen(__ -> folderApiService.update(folder))
                .delayUntil(tuple2 -> {
                    Folder old = tuple2.getT1();
                    return businessEventPublisher.publishFolderCommonEvent(folder.getId(), old.getName() + " => " + folder.getName(),
                            EventType.FOLDER_UPDATE);
                })
                .map(tuple2 -> ResponseView.success(tuple2.getT2()));
    }

    /**
     * get all files under folder
     */
    @Override
    public Mono<ResponseView<List<?>>> getElements(@RequestParam(value = "id", required = false) String folderId,
            @RequestParam(value = "applicationType", required = false) ApplicationType applicationType) {
        String objectId = gidService.convertFolderIdToObjectId(folderId);
        return folderApiService.getElements(objectId, applicationType)
                .collectList()
                .delayUntil(__ -> folderApiService.upsertLastViewTime(objectId))
                .map(ResponseView::success);
    }

    @Override
    public Mono<ResponseView<Void>> move(@PathVariable("id") String applicationLikeId,
            @RequestParam(value = "targetFolderId", required = false) String targetFolderId) {
        String objectId = gidService.convertFolderIdToObjectId(targetFolderId);
        return folderApiService.move(applicationLikeId, objectId)
                .then(businessEventPublisher.publishApplicationCommonEvent(applicationLikeId, objectId, APPLICATION_MOVE))
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    @Override
    public Mono<ResponseView<Void>> updatePermission(@PathVariable String folderId,
            @PathVariable String permissionId,
            @RequestBody UpdatePermissionRequest updatePermissionRequest) {
        String objectId = gidService.convertFolderIdToObjectId(folderId);
        ResourceRole role = ResourceRole.fromValue(updatePermissionRequest.role());
        if (role == null) {
            return ofError(INVALID_PARAMETER, "INVALID_PARAMETER", updatePermissionRequest);
        }

        return folderApiService.updatePermission(objectId, permissionId, role)
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    @Override
    public Mono<ResponseView<Void>> removePermission(
            @PathVariable String folderId,
            @PathVariable String permissionId) {
        String objectId = gidService.convertFolderIdToObjectId(folderId);

        return folderApiService.removePermission(objectId, permissionId)
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    @Override
    public Mono<ResponseView<Void>> grantPermission(
            @PathVariable String folderId,
            @RequestBody BatchAddPermissionRequest request) {
        String objectId = gidService.convertFolderIdToObjectId(folderId);
        ResourceRole role = ResourceRole.fromValue(request.role());
        if (role == null) {
            return ofError(INVALID_PARAMETER, "INVALID_PARAMETER", request.role());
        }
        return folderApiService.grantPermission(objectId, request.userIds(), request.groupIds(), role)
                .then(Mono.fromSupplier(() -> ResponseView.success(null)));
    }

    @Override
    public Mono<ResponseView<ApplicationPermissionView>> getApplicationPermissions(@PathVariable String folderId) {
        String objectId = gidService.convertFolderIdToObjectId(folderId);
        return folderApiService.getPermissions(objectId)
                .map(ResponseView::success);
    }
}
