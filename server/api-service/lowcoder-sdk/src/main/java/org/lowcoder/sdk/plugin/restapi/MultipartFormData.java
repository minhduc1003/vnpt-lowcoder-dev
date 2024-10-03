package org.lowcoder.sdk.plugin.restapi;

import lombok.Setter;

import static com.google.common.base.Strings.nullToEmpty;

@Setter
public class MultipartFormData {
    private String name;
    private String data;

    public String getName() {
        return nullToEmpty(name);
    }

    public String getData() {
        return data;
    }
}
