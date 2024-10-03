package org.lowcoder.domain.user.model;

import static com.google.common.collect.Maps.newHashMap;
import static org.apache.commons.lang3.BooleanUtils.isTrue;
import static org.lowcoder.domain.user.constant.UserStatusType.HAS_SHOW_NEW_USER_GUIDANCE;

import java.util.Map;

import lombok.extern.jackson.Jacksonized;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.google.common.collect.ImmutableMap;

import lombok.Builder;

@Builder
@Jacksonized
@Document
public class UserStatus {

    @Id
    private final String id;

    private final Boolean hasShowNewUserGuidance;

    private final Boolean banned;

    private final Map<String, Object> statusMap;

    public String getId() {
        return id;
    }

    public Map<String, Object> getStatusMap() {
        if (statusMap == null) {
            return ImmutableMap.of(HAS_SHOW_NEW_USER_GUIDANCE.getValue(), isTrue(hasShowNewUserGuidance));
        }

        if (statusMap.containsKey(HAS_SHOW_NEW_USER_GUIDANCE.getValue())) {
            return statusMap;
        }

        Map<String, Object> result = newHashMap(statusMap);
        result.put(HAS_SHOW_NEW_USER_GUIDANCE.getValue(), isTrue(hasShowNewUserGuidance));
        return result;
    }

    public boolean hasShowNewUserGuidance() {
        return isTrue(hasShowNewUserGuidance);
    }

    public Boolean isBanned() {
        return isTrue(banned);
    }
}
