package org.lowcoder.api.query;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.lowcoder.api.common.InitData;
import org.lowcoder.api.common.mockuser.WithMockUser;
import org.lowcoder.api.datasource.DatasourceApiService;
import org.lowcoder.api.datasource.DatasourceApiServiceIntegrationTest;
import org.lowcoder.api.query.view.LibraryQueryView;
import org.lowcoder.domain.query.model.LibraryQuery;
import org.lowcoder.sdk.constants.FieldName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import static org.lowcoder.api.common.mockuser.WithMockUser.DEFAULT_CURRENT_ORG_ID;

@SuppressWarnings("SameParameterValue")
@SpringBootTest
@ActiveProfiles("test")
@Disabled("Enable after all plugins are loaded in test mode")
//@RunWith(SpringRunner.class)
public class LibraryQueryApiServiceIntegrationTest {

    @Autowired
    private DatasourceApiService datasourceApiService;
    @Autowired
    private LibraryQueryApiService libraryQueryApiService;
    @Autowired
    private InitData initData;

    @BeforeEach
    public void beforeEach() {
        initData.init();
    }

    @Test
    @WithMockUser
    public void testListLibraryQueries() {
        Mono<List<LibraryQueryView>> listMono = datasourceApiService.create(DatasourceApiServiceIntegrationTest.buildMysqlDatasource("mysql06"))
                .flatMap(datasource -> libraryQueryApiService.create(buildLibraryQuery("query01", datasource.getId())))
                .then(libraryQueryApiService.listLibraryQueries());

        StepVerifier.create(listMono)
                .assertNext(libraryQueryViews -> {
                    Assertions.assertNotNull(find(libraryQueryViews, "query01"));
                    Assertions.assertTrue(FieldName.isGID(find(libraryQueryViews, "query01").gid()));
                })
                .verifyComplete();
    }

    private LibraryQueryView find(Collection<LibraryQueryView> libraryQueryViews, String name) {
        return libraryQueryViews.stream()
                .filter(libraryQueryView -> libraryQueryView.name().equals(name))
                .findFirst()
                .orElse(null);
    }

    private LibraryQuery buildLibraryQuery(String name, String datasourceId) {
        Map<String, Object> dsl = Map.of("query", Map.of("datasourceId", datasourceId));
        return LibraryQuery.builder()
                .name(name)
                .organizationId(DEFAULT_CURRENT_ORG_ID)
                .libraryQueryDSL(dsl)
                .build();
    }
}