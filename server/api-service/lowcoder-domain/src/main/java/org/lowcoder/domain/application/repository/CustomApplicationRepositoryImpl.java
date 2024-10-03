package org.lowcoder.domain.application.repository;

import org.lowcoder.domain.application.model.Application;
import org.lowcoder.sdk.constants.FieldName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public class CustomApplicationRepositoryImpl implements CustomApplicationRepository {

    @Autowired
    private ReactiveMongoTemplate reactiveMongoTemplate;

    @Override
    public Flux<Application> findByOrganizationIdWithDsl(String organizationId) {
        Criteria criteria = Criteria.where("organizationId").is(organizationId);
        Query query = new Query(criteria);
        return reactiveMongoTemplate.find(query, Application.class);
    }

    @Override
    public Mono<Application> findByIdWithDsl(String applicationId) {
        return reactiveMongoTemplate.findOne(new Query(Criteria.where(FieldName.guessFieldNameFromId(applicationId)).is(applicationId)), Application.class);
    }
}
