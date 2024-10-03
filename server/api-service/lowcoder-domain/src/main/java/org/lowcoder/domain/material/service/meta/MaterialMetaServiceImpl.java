package org.lowcoder.domain.material.service.meta;

import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.apache.commons.collections4.MapUtils;
import org.lowcoder.domain.material.model.MaterialMeta;
import org.lowcoder.domain.material.repository.MaterialMateRepository;
import org.lowcoder.sdk.constants.FieldName;
import org.lowcoder.sdk.exception.BizError;
import org.lowcoder.sdk.exception.BizException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.GroupOperation;
import org.springframework.data.mongodb.core.aggregation.MatchOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Service
public class MaterialMetaServiceImpl implements MaterialMetaService {

    private final ReactiveMongoTemplate reactiveMongoTemplate;
    private final MaterialMateRepository repository;

    @Override
    public Mono<Boolean> existsByOrgIdAndFilename(String orgId, String filename) {
        return repository.existsByOrgIdAndFilename(orgId, filename);
    }

    @Override
    public Mono<MaterialMeta> findById(String id) {
        if (id == null) {
            return Mono.error(new BizException(BizError.INVALID_PARAMETER, "INVALID_PARAMETER", FieldName.ID));
        }

        return repository.findById(id)
                .switchIfEmpty(Mono.error(new BizException(BizError.NO_RESOURCE_FOUND, "MATERIAL_NOT_FOUND", id)));
    }

    @Override
    public Mono<MaterialMeta> create(MaterialMeta object) {
        return Mono.just(object)
                .flatMap(repository::save);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Mono<Long> totalSize(String orgId) {
        MatchOperation match = Aggregation.match(new Criteria("orgId").is(orgId));
        GroupOperation sum = Aggregation.group().sum("size").as("total");
        return reactiveMongoTemplate.aggregate(Aggregation.newAggregation(match, sum), MaterialMeta.class, Map.class)
                .next()
                .map(map -> MapUtils.getLong(map, "total", 0L))
                .defaultIfEmpty(0L);
    }

    @Override
    public Flux<MaterialMeta> getByOrgId(String orgId) {
        return repository.findByOrgId(orgId);
    }

    @Override
    public Mono<Void> deleteById(String id) {
        return repository.deleteById(id);
    }
}
