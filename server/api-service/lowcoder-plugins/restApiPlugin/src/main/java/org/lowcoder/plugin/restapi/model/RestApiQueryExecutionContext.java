package org.lowcoder.plugin.restapi.model;

import jakarta.annotation.Nullable;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.lowcoder.sdk.models.Property;
import org.lowcoder.sdk.plugin.common.ssl.SslConfig;
import org.lowcoder.sdk.plugin.restapi.auth.AuthConfig;
import org.lowcoder.sdk.query.QueryExecutionContext;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpMethod;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Builder
public class RestApiQueryExecutionContext extends QueryExecutionContext {

    private URI uri;
    private HttpMethod httpMethod;

    @Setter
    private Map<String, String> headers;
    @Setter
    private Map<String, String> urlParams;
    private List<Property> bodyParams;
    private QueryBody queryBody;
    private String contentType;
    private boolean encodeParams;

    private Set<String> forwardCookies;
    private boolean forwardAllCookies;
    private MultiValueMap<String, HttpCookie> requestCookies;
    @Nullable
    private AuthConfig authConfig;
    @Getter
    private Mono<List<Property>> authTokenMono;
    private SslConfig sslConfig;
    private long timeoutMs;

    public URI getUri() {
        return uri;
    }

    public QueryBody getQueryBody() {
        return queryBody;
    }

    public String getContentType() {
        return contentType;
    }

    public HttpMethod getHttpMethod() {
        return httpMethod;
    }

    public boolean isEncodeParams() {
        return encodeParams;
    }

    public Map<String, String> getHeaders() {
        return headers;
    }

    public Map<String, String> getUrlParams() {
        return urlParams;
    }

    public List<Property> getBodyParams() {
        return bodyParams;
    }

    public Set<String> getForwardCookies() {
        return forwardCookies;
    }

    public boolean isForwardAllCookies() {
        return forwardAllCookies;
    }

    public MultiValueMap<String, HttpCookie> getRequestCookies() {
        return requestCookies;
    }

    @Nullable
    public AuthConfig getAuthConfig() {
        return authConfig;
    }

    public SslConfig getSslConfig() {
        return sslConfig;
    }

	public long getTimeoutMs() {
		return timeoutMs;
	}
}
