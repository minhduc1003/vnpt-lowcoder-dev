package org.lowcoder.domain.folder.model;


import com.github.f4b6a3.uuid.UuidCreator;
import jakarta.annotation.Nullable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.lowcoder.sdk.models.HasIdAndAuditing;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document
@NoArgsConstructor
public class Folder extends HasIdAndAuditing {

    private String organizationId;
    private String gid;
    @Nullable
    private String parentFolderId; // null represents folder in the root folder
    private String parentFolderGid; // null represents folder in the root folder
    private String name;
    private String title;
    private String description;
    private String category;
    private String type;
    private String image;
}
