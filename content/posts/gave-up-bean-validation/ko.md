---
title:  "그래서 나는 Bean Validation을 그만두었다."
description: "유효성 검증은 어디서 어떻게 처리하는게 좋을까?"
publishedAt: "2026-04-15"
updatedAt: "2026-04-15"
tags: ["Spring", "Bean Validation"]
draft: true
locale: "ko"
slug: "gave-up-bean-validation"
---

## 0. 제목의 출처
`요루시카`의 `그래서 나는 음악을 그만두었다`에서 제목을 가져왔다.  

<iframe
src="https://www.youtube.com/embed/KTZ-y85Erus"  
title="YouTube video player"  
loading="lazy"
referrerpolicy="strict-origin-when-cross-origin"                                                      
allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
allowfullscreen>
</iframe>

## 1. 입력값 유효성 검증
백엔드 / 서버 개발을 하다보면 한 번쯤은 사용자의 입력 값에 대한 유효성 검증이 필요해진다.    
회원가입, 로그인, 게시글 작성처럼 사용자가 입력 값을 넣는 곳에서는 클라이언트에서 들어오는 값이 기대한 형태인지 반드시 확인해야 한다.  

> **그 이유는 단순히 “값이 이상하면 안 된다”는 수준을 넘는다.**

#### 클라이언트는 신뢰할 수 없다.
- 프론트엔드 검증은 언제든 우회될 수 있다.
- 직접 API를 호출하면 어떤 값이든 들어올 수 있다.
#### 잘못된 값은 시스템의 상태를 깨뜨린다.
- null, 잘못된 형식, 예상 범위를 벗어난 값은 예외를 유발한다.
- 데이터 정합성이 무너지면 이후 로직 전체에 영향을 준다.
#### 입력값은 결국 도메인 규칙과 연결된다.
- 비밀번호 길이, 이메일 형식, 상태 값 등은 단순한 형식이 아니라 서비스의 정책이다.
#### 검증이 없다면 책임이 뒤로 밀린다.
- 초기에 걸러야 할 문제가 서비스 로직이나 DB까지 전파된다.
- 문제의 원인을 추적하기 어려워진다.

따라서 입력값의 유효성 검증은 단순한 방어 코드가 아니라. 시스템의 안정성과 일관성을 유지하기 위한 첫 번째 단계라고 볼 수 있다.
이런 이유로 Java 진영에서는 이러한 검증을 해결하기 위해 오래전 부터 다양한 시도들이 있었다.

#### [`Apache Commons Validator`](https://commons.apache.org/proper/commons-validator/)
- 이메일, URL 등 자주 사용하는 검증 로직을 라이브러리 형태로 제공
- 직접 메서드를 호출하는 방식 (`EmailValidator`, `UrlValidator` 등)
#### [`Guava`](https://github.com/google/guava)
- Google에서 개발한 Java Core 라이브러리 (유효성 검증 이외의 다양한 기능을 포함한다.)
- `Preconditions`를 통해 간단한 검증 지원
#### [`Spring Framework Assert API`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/util/Assert.html)
- `Assert.notNull`, `Assert.hasText` 등을 통해 검증 수행
- Spring 내부 및 애플리케이션 전반에서 사용되는 유틸성 검증 방식
#### [`Struts Validation Framework`](https://struts.apache.org/core-developers/validation)
- 검증 규칙을 XML로 분리하여 선언적으로 관리
- `<field depends="required,email">` 형태
#### [`Java Bean Validation API`](https://beanvalidation.org/)
- 어노테이션 기반의 유효성 검증 라이브러리
- Java EE에 통합되어 있었으며 현재는 Jakarta EE에 들어있다.
- JSR이 표준(Spec)이고 Hibernate Validator라는 구현체를 통해서 사용한다.

## 2. Java Bean Validation
검색엔진에서 Spring 유효성 검증 예제를 찾아보면 아래와 같은 코드를 어렵지 않게 볼 수 있다.  
의존성을 추가하고, DTO에 관련 어노테이션을 붙여서 DTO가 검증의 책임을 가져가게 하는 구조로 설명한다.  
나 또한 이게 정해라고 믿고 있었고, 그렇게 개발해온 적이 많았다.

### 웹에서 많이 찾을 수 있는 설명

Spring Boot에서는 아래와 같은 의존성을 추가해서 바로 사용할 수 있다.
```Kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-validation")
}
```
이 의존성을 추가하면 `@NotNull`, `@Size`, `@Email`과 같은 다양한 검증 어노테이션을 사용할 수 있게 된다.

예를 들면 아래처럼 `회원(Member)`이라는 도메인이 있고 회원을 생성 해야 한다면, 다음과 같은 형태를 통해서 입력값을 검증할 수 있다.
```java
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateMemberRequest {
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이어야 합니다.")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, max = 20, message = "비밀번호는 8자 이상 20자 이하로 입력해야 합니다.")
    private String password;

    @NotBlank(message = "이름은 필수입니다.")
    private String name;
}
```
그리고 컨트롤러에서 @Valid 또는 @Validated를 사용하면, 요청 시점에 DTO에 선언된 제약 조건들이 자동으로 검사된다.

```java
@PostMapping
public void createMember(@RequestBody @Valid CreateMemberRequest request) {
    // 회원 생성 로직
}
```

겉으로 보면 DTO에 어노테이션을 붙이고 `@Valid`를 선언하는 것만으로 검증이 끝나는 것처럼 보이지만, 실제로는 내부에서 다음과 같은 과정이 수행된다.
#### `@Valid`
- JSR (Jakarta Bean Validation) 기반의 표준 어노테이션
- Spring에서도 그대로 지원하며, 주로 요청 객체 검증에 사용된다
- 컨트롤러 파라미터에 사용되는 경우 검증은 Argument Resolver 단계에서 수행된다
- 요청 바디(JSON)가 CreateMemberRequest 객체로 변환된다
- 이 과정은 Spring의 HandlerMethodArgumentResolver
- (구체적으로는 RequestResponseBodyMethodProcessor)가 담당한다
- Argument Resolver는 파라미터에 붙은 @Valid를 확인한다
- 내부적으로 WebDataBinder를 생성하고 Validator를 호출한다
- DTO에 선언된 제약 조건을 기반으로 검증을 수행한다
- 검증 실패 시 즉시 예외를 발생시킨다. (`MethodArgumentNotValidException`)

#### `@Validated`
- Spring에서 제공하는 확장 어노테이션
- @Valid와 동일하게 DTO 검증에 사용할 수 있으며, 추가 기능을 제공한다
- DTO 검증 시에는 동일하게 Argument Resolver 단계에서 수행된다
- 요청 바디 → DTO 변환
- @Validated 확인
- WebDataBinder를 통한 Validator 호출
- 제약 조건 검증 수행
- 실패 시 예외 발생
- DTO 검증 시 발생하는 예외는 @Valid와 동일하다.

MethodArgumentNotValidException
- https://www.freeism.co.kr/wp/archives/883
- https://blog.frankel.ch/bean-validation-and-jsr-303/
- https://blog.outsider.ne.kr/710#google_vignette
