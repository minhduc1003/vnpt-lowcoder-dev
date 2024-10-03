package org.lowcoder.sdk.exception;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.helpers.MessageFormatter;

@Slf4j
public class ServerException extends BaseException {

    public ServerException(String messageTemplate, Object... args) {
        super(MessageFormatter.arrayFormat(messageTemplate, args, null).getMessage());
    }
}
