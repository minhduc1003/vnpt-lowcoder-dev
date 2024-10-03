package org.lowcoder.domain.authentication;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.lowcoder.domain.organization.service.OrgMemberService;
import org.lowcoder.domain.organization.service.OrganizationService;
import org.lowcoder.sdk.auth.AbstractAuthConfig;
import org.lowcoder.sdk.auth.EmailAuthConfig;
import org.lowcoder.sdk.config.AuthProperties;
import org.lowcoder.sdk.config.CommonConfig;
import org.lowcoder.sdk.constants.AuthSourceConstants;
import org.lowcoder.sdk.constants.WorkspaceMode;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.lowcoder.sdk.exception.BizError.LOG_IN_SOURCE_NOT_SUPPORTED;
import static org.lowcoder.sdk.util.ExceptionUtils.ofError;

@Slf4j
@RequiredArgsConstructor
@Service
public class AuthenticationServiceImpl implements AuthenticationService {

    private final OrganizationService organizationService;
    private final OrgMemberService orgMemberService;
    private final CommonConfig commonConfig;
    private final AuthProperties authProperties;

    @Override
    public Mono<FindAuthConfig> findAuthConfigByAuthId(String orgId, String authId) {
        return findAuthConfig(orgId, abstractAuthConfig -> Objects.equals(authId, abstractAuthConfig.getId()));
    }

    @Override
    @Deprecated
    public Mono<FindAuthConfig> findAuthConfigBySource(String orgId, String source) {
        return findAuthConfig(orgId, abstractAuthConfig -> Objects.equals(source, abstractAuthConfig.getSource()));
    }

    private Mono<FindAuthConfig> findAuthConfig(String orgId, Function<AbstractAuthConfig, Boolean> condition) {
        return findAllAuthConfigs(orgId,true)
                .filter(findAuthConfig -> condition.apply(findAuthConfig.authConfig()))
                .next()
                .switchIfEmpty(ofError(LOG_IN_SOURCE_NOT_SUPPORTED, "LOG_IN_SOURCE_NOT_SUPPORTED"));
    }

    @Override
    public Flux<FindAuthConfig> findAllAuthConfigs(String orgId, boolean enableOnly) {

        Mono<FindAuthConfig> emailAuthConfigMono = orgMemberService.doesAtleastOneAdminExist()
                .map(doesAtleastOneAdminExist -> {
                    boolean shouldEnableRegister;
                    if(doesAtleastOneAdminExist) {
                        shouldEnableRegister = authProperties.getEmail().getEnableRegister();
                    } else {
                        shouldEnableRegister = Boolean.TRUE;
                    }
                    return new FindAuthConfig
                            (new EmailAuthConfig(AuthSourceConstants.EMAIL, authProperties.getEmail().isEnable(), shouldEnableRegister), null);
                });


        Flux<FindAuthConfig> findAuthConfigFlux = findAllAuthConfigsByDomain()
                .switchIfEmpty(findAllAuthConfigsForEnterpriseMode())
                .switchIfEmpty(findAllAuthConfigsForSaasMode(orgId))
                .filter(findAuthConfig -> {
                    if (enableOnly) {
                        return findAuthConfig.authConfig().isEnable();
                    }
                    return true;
                });

        return Flux.concat(findAuthConfigFlux, emailAuthConfigMono);

    }

    private Flux<FindAuthConfig> findAllAuthConfigsByDomain() {
        return organizationService.getByDomain()
                .flatMapIterable(organization ->
                        organization.getAuthConfigs()
                                .stream()
                                .map(abstractAuthConfig -> new FindAuthConfig(abstractAuthConfig, organization))
                                .collect(Collectors.toList())
                );
    }

    protected Flux<FindAuthConfig> findAllAuthConfigsForEnterpriseMode() {
        if (commonConfig.getWorkspace().getMode() == WorkspaceMode.SAAS) {
            return Flux.empty();
        }
        return organizationService.getOrganizationInEnterpriseMode()
                .flatMapIterable(organization ->
                        organization.getAuthConfigs()
                                .stream()
                                .map(abstractAuthConfig -> new FindAuthConfig(abstractAuthConfig, organization))
                                .collect(Collectors.toList())
                );
    }

    private Flux<FindAuthConfig> findAllAuthConfigsForSaasMode(String orgId) {
        if (commonConfig.getWorkspace().getMode() == WorkspaceMode.SAAS) {

            // Get the auth configs for the current org
            if(orgId != null) {
                return organizationService.getById(orgId)
                        .flatMapIterable(organization ->
                                organization.getAuthConfigs()
                                        .stream()
                                        .map(abstractAuthConfig -> new FindAuthConfig(abstractAuthConfig, organization))
                                        .collect(Collectors.toList())
                        );
            }

        }
        return Flux.empty();
    }
}
