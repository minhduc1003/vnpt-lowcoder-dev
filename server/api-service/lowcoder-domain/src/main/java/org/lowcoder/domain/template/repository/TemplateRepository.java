package org.lowcoder.domain.template.repository;

import jakarta.annotation.Nonnull;
import org.lowcoder.domain.template.model.Template;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;

@Repository
public interface TemplateRepository extends ReactiveMongoRepository<Template, String> {

    @Nonnull
    Mono<Template> findById(@Nonnull String id);

    Flux<Template> findByApplicationIdIn(Collection<String> applicationId);

    Mono<Template> findByApplicationId(String applicationId);
}
