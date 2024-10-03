package org.lowcoder.api.home;

import java.time.Instant;
import java.util.List;

import org.lowcoder.api.application.view.ApplicationInfoView;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@Builder
@ToString
public class FolderInfoView {

    private final String orgId;
    private final String folderId;
    private final String folderGid;
    private final String parentFolderId;
    private final String parentFolderGid;
    private final String name;
    private final String title;
    private final String description;
    private final String category;
    private final String type;
    private final String image;
    private final Long createAt;
    private final String createBy;
    private boolean isVisible;
    private boolean isManageable;

    private List<FolderInfoView> subFolders;
    private List<ApplicationInfoView> subApplications;

    private final Instant createTime;
    private final Instant lastViewTime;

    public long getCreateTime() {
        return createTime == null ? 0 : createTime.toEpochMilli();
    }

    public long getLastViewTime() {
        return lastViewTime == null ? 0 : lastViewTime.toEpochMilli();
    }

    /**
     * used by front end.
     *
     * @see ApplicationInfoView#isFolder()
     */
    public boolean isFolder() {
        return true;
    }
}
