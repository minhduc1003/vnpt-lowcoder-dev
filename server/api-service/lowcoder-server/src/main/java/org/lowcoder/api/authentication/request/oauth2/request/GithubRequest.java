package org.lowcoder.api.authentication.request.oauth2.request;

import static java.net.URLDecoder.decode;
import static java.nio.charset.StandardCharsets.UTF_8;
import static org.lowcoder.sdk.plugin.common.constant.Constants.HTTP_TIMEOUT;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.client.utils.URIBuilder;
import org.lowcoder.api.authentication.request.AuthException;
import org.lowcoder.api.authentication.request.oauth2.OAuth2RequestContext;
import org.lowcoder.api.authentication.request.oauth2.Oauth2DefaultSource;
import org.lowcoder.domain.user.model.AuthToken;
import org.lowcoder.domain.user.model.AuthUser;
import org.lowcoder.sdk.auth.Oauth2SimpleAuthConfig;
import org.lowcoder.sdk.util.JsonUtils;
import org.lowcoder.sdk.webclient.WebClientBuildHelper;
import org.lowcoder.sdk.webclient.WebClients;
import org.springframework.core.ParameterizedTypeReference;

import reactor.core.publisher.Mono;

public class GithubRequest extends AbstractOauth2Request<Oauth2SimpleAuthConfig> {

    public GithubRequest(Oauth2SimpleAuthConfig config) {
        super(config, Oauth2DefaultSource.GITHUB);
    }

    @Override
    protected Mono<AuthToken> getAuthToken(OAuth2RequestContext context) {
        URI uri;
        try {
            uri = new URIBuilder(source.accessToken())
                    .addParameter("code", context.getCode())
                    .addParameter("client_id", config.getClientId())
                    .addParameter("client_secret", config.getClientSecret())
                    .addParameter("grant_type", "authorization_code")
                    .addParameter("redirect_uri", context.getRedirectUrl())
                    .build();
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }
        return WebClientBuildHelper.builder()
                .systemProxy()
                .timeoutMs(HTTP_TIMEOUT)
                .build()
                .post()
                .uri(uri)
                .exchangeToMono(response -> response.bodyToMono(String.class))
                .map(this::parseStringToMap)
                .flatMap(map -> {
                    if (map.containsKey("error")) {
                        return Mono.error(new AuthException(JsonUtils.toJson(map)));
                    }
                    AuthToken accessToken = AuthToken.builder()
                            .accessToken(map.get("access_token"))
                            .build();
                    return Mono.just(accessToken);
                });
    }

    @Override
    protected Mono<AuthToken> refreshAuthToken(String refreshToken) {
        return Mono.empty();
    }

    private Map<String, String> parseStringToMap(String s) {
        if (StringUtils.isBlank(s)) {
            return new HashMap<>();
        }

        Map<String, String> result = new HashMap<>();
        for (String item : s.split("&")) {
            if (StringUtils.isNotBlank(item)) {
                String[] kv = item.split("=");
                result.put(decode(kv[0], UTF_8), kv.length == 2 ? decode(kv[1], UTF_8) : null);
            }
        }
        return result;
    }

    @Override
    protected Mono<AuthUser> getAuthUser(AuthToken authToken) {
        return WebClientBuildHelper.builder()
                .systemProxy()
                .timeoutMs(HTTP_TIMEOUT)
                .build()
                .get()
                .uri(source.userInfo())
                .header("Authorization", "token " + authToken.getAccessToken())
                .exchangeToMono(response -> response.bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                }))
                .flatMap(map -> {
                    if (map.containsKey("error")) {
                        return Mono.error(new AuthException(JsonUtils.toJson(map)));
                    }
                    String username = MapUtils.getString(map, "email");
                    AuthUser authUser = AuthUser.builder()
                            .uid(map.get("id").toString())
                            .username(username == null ? MapUtils.getString(map, "login") : username)
                            .avatar(MapUtils.getString(map, "avatar_url"))
                            .rawUserInfo(map)
                            .build();
                    return Mono.just(authUser);
                });
    }
}
