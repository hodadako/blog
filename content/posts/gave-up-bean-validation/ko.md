---
title:  "그래서 나는 Bean Validation을 그만두었다."
description: "비즈니스 규칙과 유효성 검증에 대한 고찰"
publishedAt: "2026-05-21"
updatedAt: "2026-05-21"
tags: ["Spring", "Bean Validation"]
draft: false
locale: "ko"
slug: "gave-up-bean-validation"
commentQuizCategory: "BACKEND"
---

## 0. 제목의 출처
요루시카의 '그래서 나는 음악을 그만두었다'에서 제목을 가져왔다.  

<iframe
src="https://www.youtube.com/embed/KTZ-y85Erus"  
title="YouTube video player"  
loading="lazy"
referrerpolicy="strict-origin-when-cross-origin"                                                      
allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
allowfullscreen>
</iframe>

---
## 1. 입력값 유효성 검증
개발을 하다보면 한 번쯤은 사용자의 입력 값에 대한 유효성 검증이 필요해진다.    
회원가입, 로그인, 게시글 작성처럼 사용자가 입력 값을 넣는 곳에서는 클라이언트에서 들어오는 값이 기대한 형태인지 반드시 확인해야 한다.  

> **그 이유는 단순히 “값이 이상하면 안 된다”는 그 이상이다.**

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

따라서 입력값의 유효성 검증은 단순한 방어 코드가 아니라. 시스템의 안정성과 일관성을 유지하기 위한 첫 번째 단계이다.
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

---
## 2. Java Bean Validation - 입력값 유효성 검증
웹에서 Spring 유효성 검증 예제를 찾아보면 아래와 같은 코드를 어렵지 않게 볼 수 있다.  
의존성을 추가하고, DTO에 관련 어노테이션을 붙여서 DTO가 검증의 책임을 가져가게 하는 구조로 설명한다.  
나도 이 방법이 나름의 정답이라고 믿고 있었고, 그렇게 개발해온 적이 많았다.

### 2.1 웹에서 많이 찾을 수 있는 설명

Spring Boot에서는 아래와 같은 의존성을 추가해서 바로 사용할 수 있다.
```kotlin
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

### 2.2 내부에서는 어떻게 동작할까?
겉으로 보면 DTO에 어노테이션을 붙이고 `@Valid` 또는 `@Validated`를 선언하는 것만으로 검증이 끝나는 것처럼 보인다.
하지만 실제로는 Spring 내부의 여러 컴포넌트가 협력하여 검증을 수행한다.

먼저 `@Valid`는 `Jakarta Bean Validation` 표준에서 제공하는 어노테이션이다.
Spring 고유의 기능은 아니지만, Spring은 이를 자연스럽게 지원한다.
주로 컨트롤러의 요청 객체를 검증할 때 사용되며, `@RequestBody`와 함께 선언하면 컨트롤러 메서드가 호출되기 전에 자동으로 검증이 수행된다.

이 과정은 Spring MVC의 `HandlerMethodArgumentResolver`가 담당한다.
구체적으로는 `RequestResponseBodyMethodProcessor`가 HTTP 요청의 JSON 데이터를 `CreateMemberRequest`와 같은 객체로 변환하고, 파라미터에 `@Valid`가 붙어 있는지 확인한다.
이후 `WebDataBinder`를 생성하여 `Bean Validation Validator`를 호출하고, DTO에 선언된 `@NotBlank`, `@Email`, `@Size` 등의 제약 조건을 검사한다.

검증에 실패하면 컨트롤러 메서드는 실행되지 않고 즉시 `MethodArgumentNotValidException`이 발생한다.
이 예외에는 어떤 필드가 어떤 이유로 검증에 실패했는지에 대한 정보(`BindingResult`)가 포함되어 있으며, Spring Boot는 이를 기반으로 400 Bad Request 응답을 생성한다.

`@Validated`는 Spring이 제공하는 확장 어노테이션이다.
요청 DTO를 검증할 때는 `@Valid`와 거의 동일하게 동작한다.
`@RequestBody`와 함께 사용하면 동일하게 `HandlerMethodArgumentResolver`와 `WebDataBinder`를 통해 Bean Validation이 수행되고, 검증 실패 시 `MethodArgumentNotValidException`이 발생한다.

두 어노테이션의 차이는 `@Validated`가 Bean Validation의 기능을 Spring 방식으로 확장했다는 점에 있다.
대표적으로 Validation Group을 지원하며, 클래스 레벨에 선언했을 때는 Spring AOP를 통해 메서드 파라미터와 반환값 검증도 수행할 수 있다.

결국 컨트롤러에서 `@Valid`와 `@Validated`를 사용하는 경우, 검증 규칙은 DTO 내부에 선언되어 있지만 실제 검증은 Spring MVC의 `ArgumentResolver`와 `WebDataBinder`가 수행한다.
겉으로는 단순히 어노테이션을 붙이는 것처럼 보이지만, 그 뒤에서는 Spring이 요청 객체 생성, Validator 호출, 예외 처리까지 모두 자동으로 처리해주고 있는 것이다.

---
## 3. 그래서 나는 Bean Validation을 그만두었다.
처음에는 위 방식이 충분히 좋아 보였다.
DTO에 제약 조건을 선언하면 어떤 값이 필요한지 한눈에 보이고,
컨트롤러 진입 전에 자동으로 검증도 수행되기 때문이다.

하지만 실제로 서비스를 만들다 보니 이 구조가 점점 어색하게 느껴졌다.

### 3.1 DTO(Data Transfer Object)는 전달만 한다.

여기서 먼저 DTO가 무엇인지 다시 생각해볼 필요가 있었다.

DTO는 이름에 `Object`가 들어가 있지만, 도메인 객체와 같은 책임을 가지는 것은 아니다.  
주된 목적은 HTTP 요청 바디를 애플리케이션 내부로 전달하거나, 계층 간에 필요한 데이터를 옮기는 것이다.

`Uncle Bob(Robert C. Martin)`은 [Objects and Data Structures](https://blog.cleancoder.com/uncle-bob/2019/06/16/ObjectsAndDataStructures.html)에서 객체(Object)와 데이터 구조(Data Structure)를 구분하면서 DTO를 다음과 같이 설명한다.

> “So a DTO – a Data Transfer Object – is not an object?”  
> “Correct. DTOs are data structures.”

또한 객체와 데이터 구조의 차이를 다음과 같이 정의한다.

> “Objects hide their data behind abstractions and expose functions that operate on that data.  
> Data structures expose their data and have no significant behavior.”

즉, 객체는 자신의 상태를 감추고 그 상태를 다루는 행위를 외부에 제공한다.  
반면 데이터 구조는 데이터를 외부에 드러내며, 그 데이터를 처리하는 행위는 구조 밖에 존재한다.

이 관점에서 보면 DTO의 역할은 명확하다.

- 외부 입력을 받아 애플리케이션 내부로 전달한다.
- 계층 간에 필요한 데이터를 옮긴다.
- 직렬화와 역직렬화를 담당한다.

반대로 DTO가 책임지지 않아야 할 것들도 있다.

- 서비스 정책
- 도메인 규칙
- 상태 전이 제약 조건
- 외부 시스템과의 제약 사항

즉, DTO는 비즈니스 규칙을 스스로 판단하고 보장하는 객체라기보다, 데이터를 전달하기 위한 구조에 가깝다.

따라서 검증 규칙이 단순한 형식 확인을 넘어 비즈니스 규칙에 가까워질수록,
그 책임을 DTO에 두는 방식은 점점 어색해진다.

### 3.2 Bean Validation이 불편했던 이유

Bean Validation을 DTO에서 유효성 검증 목적으로 사용하다보니, 특히 아래와 같은 부분들이 불편했다.

#### 3.2.1 검증 규칙이 DTO에 박힌다.
DTO는 전달을 위한 구조인데, 검증 규칙이 추가되면서 정책과 도메인 규칙까지 함께 담게 된다.

```java
public class CreateMemberRequest {

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이어야 합니다.")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, max = 20, message = "비밀번호는 8자 이상 20자 이하로 입력해야 합니다.")
    private String password;

    @NotBlank(message = "닉네임은 필수입니다.")
    @Pattern(
        regexp = "^[가-힣a-zA-Z0-9]{2,12}$",
        message = "닉네임은 2자 이상 12자 이하의 한글, 영어, 숫자만 사용할 수 있습니다."
    )
    private String nickname;
}
```
처음에는 단순해 보이지만, 시간이 지나면 DTO는 요청 데이터를 담는 구조가 아니라 서비스 정책을 설명하는 장소처럼 변한다.

특히 `비밀번호는 몇 자 이상이어야 하는가`, `닉네임에 어떤 문자를 허용할 것인가` 같은 규칙은 단순한 기술적 형식이 아니라 서비스가 정한 정책이다.

#### 3.2.2 검증 실행 위치와 규칙 정의 위치가 분리된다.
규칙은 DTO에 선언되어 있지만, 실제 검증은 Spring MVC의 Argument Resolver를 통해 수행된다.  
그리고 검증이 실행되려면 컨트롤러 파라미터에 @Valid 또는 @Validated가 붙어 있어야 한다.

```java
// MemberController.java
@PostMapping("/members")
public void createMember(@RequestBody @Valid CreateMemberRequest request) {
    memberService.create(request);
}
```
이 구조는 검증의 책임을 애매하게 만든다.

- 규칙은 DTO에 있다.
- 실행은 Spring MVC가 한다.
- 실행 여부는 컨트롤러 파라미터 선언에 달려 있다.

#### 3.2.3 순서와 맥락이 있는 검증을 표현하기 어렵다.

Bean Validation은 필드 단위의 단순한 검증에는 편리하지만, 검증 순서를 제어해야 하는 순간부터 구조가 복잡해진다.

예를 들어 아래와 같은 DTO가 있다고 해보자.

```java
public class CreateMemberRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8, max = 20)
    private String password;
}
```
겉보기에는 간단하지만, 실제로는 다음과 같은 순서를 기대하게 된다.

1. 이메일이 비어 있지 않은지 확인한다.
2. 이메일이 존재할 때만 이메일 형식을 검사한다.
3. 비밀번호가 비어 있지 않은지 확인한다.
4. 비밀번호가 존재할 때만 길이를 검사한다.

즉, `@NotBlank`가 실패했다면 `@Email`이나 `@Size`는 수행할 필요가 없다.

이를 명시적으로 표현하려면 `ValidationGroup`과 `GroupSequence`를 사용해야 한다.

```java
public interface RequiredChecks {}
public interface FormatChecks {}

@GroupSequence({RequiredChecks.class, FormatChecks.class})
public interface ValidationOrder {}

public class CreateMemberRequest {

    @NotBlank(groups = RequiredChecks.class)
    @Email(groups = FormatChecks.class)
    private String email;

    @NotBlank(groups = RequiredChecks.class)
    @Size(min = 8, max = 20, groups = FormatChecks.class)
    private String password;
}

//MemberController.java
@PostMapping("/members")
public void createMember(@RequestBody @Validated(ValidationOrder.class) CreateMemberRequest request) {
    memberService.create(request);
}
```
단순히 __"`@NotBlank`가 먼저 실행되고, 그 다음 형식 검사를 수행한다"__ 는 의도를 표현하기 위해

그룹 인터페이스를 만들고
Group Sequence를 정의하고
각 제약 조건에 그룹을 지정하고
@Validated에 순서를 명시해야 한다.

물론 Bean Validation이 이러한 기능을 제공한다는 점은 강력하다. 하지만 검증 흐름이 복잡해질수록, 어노테이션만으로 표현하는 방식은 점점 부담스럽게 느껴졌다.

#### 3.2.4 뭘 테스트해야 하는지 애매하다.
Bean Validation을 테스트할 때는 보통 `ValidatorFactory`를 사용해 DTO를 직접 검증한다.

```java
class CreateMemberRequestTest {

    private final Validator validator = Validation
        .buildDefaultValidatorFactory()
        .getValidator();

    @Test
    void 이메일이_비어있으면_검증에_실패한다() {
        CreateMemberRequest request = new CreateMemberRequest(
            "",
            "password123",
            "nickname"
        );

        Set<ConstraintViolation<CreateMemberRequest>> violations =
            validator.validate(request);

        assertThat(violations).isNotEmpty();
    }
}
```

이 테스트는 DTO에 선언된 Bean Validation 어노테이션이 동작하는지는 확인할 수 있다.
하지만 실제 요청 흐름에서 검증이 수행되는지는 보장하지 않는다.

실제 동작은 다음 요소들에 의존하기 때문이다.

- 컨트롤러 파라미터에 @Valid가 붙어 있는가
- Spring MVC Argument Resolver가 검증을 트리거하는가
- 검증 실패 시 MethodArgumentNotValidException이 발생하는가
- 예외가 원하는 응답 형식으로 변환되는가

그래서 실제 흐름을 검증하려면 결국 MVC 기반의 테스트가 필요해진다.

---
결국 Bean Validation을 사용하면서 느낀 가장 큰 의문은 이것이었다.

> 검증의 본질이 비즈니스 규칙이라면, 그리고 DTO가 단지 데이터를 전달하는 구조라면,
이 규칙의 최종 책임은 어디에 있어야 할까?

내가 내린 결론은 명확했다.

> 도메인 모델은 비즈니스 규칙을 스스로 보장할 수 있어야 한다.

---
## 4. 도메인 모델은 어떻게 비즈니스 규칙을 보장할 수 있을까?

여기서 말하는 도메인 모델이란 하나의 클래스만을 의미하지 않는다.  
값 자체를 표현하는 값 객체, 식별성과 생명주기를 가지는 엔티티, 그리고 이들이 협력하며 만들어내는 도메인 모델 전체를 의미한다.

따라서 도메인이 스스로 유효성을 보장한다는 말은 모든 검증을 하나의 객체에 몰아넣는다는 뜻이 아니다.

값 자체에 대한 규칙은 값 객체(Value Object)가 보장하고, 상태 변화에 대한 규칙은 엔티티(Entity)가 보장할 수 있다.  
서비스는 이 규칙을 대신 판단하기보다, 필요한 객체를 만들고 협력시키는 흐름을 조정한다.

### 4.1 값 자체의 규칙은 값 객체(Value Object)가 보장하도록 만든다.
이메일, 비밀번호, 닉네임 같은 값은 겉으로 보면 단순한 문자열처럼 보인다.  
하지만 실제 서비스 안에서는 각각의 규칙을 가진다.

- 이메일은 올바른 형식이어야 한다.
- 비밀번호는 서비스의 보안 정책을 만족해야 한다.
- 닉네임은 허용된 문자와 길이를 만족해야 한다.

이런 값을 모두 `String`으로만 다루면, 해당 값을 사용하는 곳마다 다시 검증이 필요해진다.

```java
public class Member {
    private String email;
    private String password;
    private String nickname;
}
```

반대로 값 객체로 표현하면, 값이 생성되는 순간 자신의 규칙을 검증할 수 있다.
```java
public record Email(String value) {
    public Email {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("이메일은 비어 있을 수 없습니다.");
        }

        if (!value.matches("^[^@]+@[^@]+\\.[^@]+$")) {
            throw new IllegalArgumentException("올바른 이메일 형식이 아닙니다.");
        }
    }
}
```

이 구조에서는 DTO에 `@Email`, `@Size`, `@Pattern` 같은 어노테이션을 붙이지 않아도, 도메인 값 자체가 자신의 규칙을 보장한다.

검증 로직이 사라진 것이 아니다.
DTO에 있던 규칙이 값이 가장 잘 알고 있는 위치로 이동한 것이다.

### 4.2 엔티티(Entity)는 자신의 행위 가능 여부를 직접 판단한다
값 객체가 값 자체의 유효성을 보장한다면, 엔티티는 자신의 상태에 따라 가능한 행위를 직접 판단해야 한다.

예를 들어 게시글은 초안 상태일 때만 발행할 수 있다고 해보자.  
이 규칙을 서비스에서 다음처럼 판단할 수도 있다.

```java
public void publishPost(Long postId) {
    Post post = postRepository.findById(postId)
        .orElseThrow();

    if (post.getStatus() != PostStatus.DRAFT) {
        throw new IllegalStateException("초안 상태의 게시글만 발행할 수 있습니다.");
    }

    post.setStatus(PostStatus.PUBLISHED);
}
```
이 방식은 서비스가 엔티티의 상태를 물어보고, 그 결과에 따라 무엇을 할지 결정한다.
즉, 서비스가 도메인 규칙을 알고 있는 구조다.

하지만 이 규칙은 게시글의 상태와 행위에 대한 규칙이다.
그렇다면 외부에서 상태를 묻고 판단하기보다, 게시글에게 발행하라고 요청하는 편이 더 자연스럽다.
```java
// PostService.java
public void publish(Long postId) {
    Post post = postRepository.findById(postId)
        .orElseThrow(() -> new PostNotFoundException(postId));
        
    post.publish()
}

public class Post {
    private PostStatus status;

    public void publish() {
        if (status != PostStatus.DRAFT) {
            throw new IllegalStateException("초안 상태의 게시글만 발행할 수 있습니다.");
        }
        this.status = PostStatus.PUBLISHED;
    }
}
```
이제 `“초안 상태의 게시글만 발행할 수 있다”`는 규칙은 Post가 직접 보장한다.
서비스는 상태를 확인하고 변경하는 책임을 가지지 않고, 게시글에게 행위를 요청하는 역할만 한다.

이런 방식은 흔히 말하는 `Tell, Don’t Ask`와도 연결된다.
객체의 상태를 꺼내서 외부에서 판단하기보다, 객체에게 무엇을 해야 하는지 말하고 판단은 객체 내부에 맡기는 것이다.
### 4.3 Service는 도메인 모델과 연관된 흐름을 조정한다

그렇다면 서비스는 어떤 책임을 가져야 할까?

값 자체의 규칙은 값 객체가 판단하고, 엔티티의 행위 가능 여부는 엔티티가 직접 판단한다.  
서비스는 이 규칙을 대신 판단하기보다, 도메인 모델이 규칙을 판단할 수 있도록 흐름을 조정하는 역할에 가깝다.

예를 들어 주문 생성 흐름을 생각해보자.

```java
// OrderService.java
public void createOrder(CreateOrderRequest request) {
    Product product = productRepository.findById(request.productId())
        .orElseThrow(() -> new ProductNotFoundException(request.productId()));

    Order order = Order.create(
        product,
        request.quantity(),
        request.shippingAddress()
    );

    orderRepository.save(order);
}

public class Order {
    private final Product product;
    private final OrderQuantity quantity;
    private final ShippingAddress shippingAddress;
    private final Money totalPrice;

    private Order(Product product, OrderQuantity quantity, ShippingAddress shippingAddress) {
        this.product = product;
        this.quantity = quantity;
        this.shippingAddress = shippingAddress;
        this.totalPrice = product.price().multiply(quantity);
    }

    public static Order create(Product product, int quantity, String shippingAddress) {
        return new Order(
            product,
            new OrderQuantity(quantity),
            new ShippingAddress(shippingAddress)
        );
    }
}
```
외부에서는 원시 값을 넘기지만, 도메인 내부에서는 이를 값 객체로 변환한다.
값 객체 생성에 실패하면 주문도 생성되지 않는다.
즉, `Order`가 생성되었다는 것은 주문을 구성하는 값들이 모두 유효하다는 의미가 된다.

여기서 서비스는 다음 일을 한다.

- 요청에서 상품 ID, 수량, 배송지를 받는다.
- 상품을 조회한다.
- 주문 생성을 도메인 모델에 요청한다.
- 생성된 주문을 저장한다.

하지만 `주문 수량이 유효한지`, `배송지가 비어 있지 않은지`, `총 주문 금액을 어떻게 계산해야 하는지`는 서비스가 직접 판단하지 않는다.

그 책임은 Order와 그 내부의 값 객체들이 가진다.

---
이렇게 규칙이 도메인 모델 안으로 이동하면 테스트 대상도 더 분명해진다.  
프레임워크의 검증 동작을 테스트하기보다, 도메인 모델이 비즈니스 규칙을 지키는지 직접 테스트할 수 있다.

---

## 5. 맺으며

Bean Validation을 완전히 부정하고 싶은 것은 아니다.  
여전히 요청 값이 비어 있는지, 명백히 잘못된 형식인지 빠르게 확인하는 용도로는 충분히 유용하다.

하지만 더 이상 Bean Validation을 검증의 중심에 두지는 않으려고 한다.

검증의 본질이 비즈니스 규칙이라면, 그 규칙은 DTO의 어노테이션에 머무르기보다 도메인 모델 안에서 표현되는 편이 더 자연스럽다고 생각한다.

그래서 검증 규칙이 생겼을 때는 먼저 DTO에 어노테이션을 붙일 수 있는지를 생각하지 않으려고 한다.  
대신 이 규칙이 어떤 성격을 가지는지, 그리고 어느 객체가 가장 자연스럽게 책임질 수 있는지를 먼저 확인한다.

아래 흐름을 통해서 앞서 설명한 검증 책임이 어디서 구현되면 좋은지 정리했다.

<img
src="https://github.com/hodadako/blog/blob/main/content/posts/gave-up-bean-validation/validation_flow.png?raw=true"
alt="validation_flow"
width="480"
/>

> 결국 내가 그만둔 것은 Bean Validation이라는 기술 자체가 아니다.  
비즈니스 규칙을 DTO의 어노테이션에 맡기는 방식을 그만둔 것이다.

---
### 참고한 글

- [Bean validation and JSR 303, Nicolas Fränkel](https://blog.frankel.ch/bean-validation-and-jsr-303/)
- [Guava를 써야하는 5가지 이유, Outsider](https://blog.outsider.ne.kr/710)
- [Blah vs Bean Validation: you missed the point like Mars Climate Orbiter, Emmanuel Bernard](https://in.relation.to/2014/06/19/blah-vs-bean-validation-you-missed-the-point-like-mars-climate-orbiter/)
- [Bean Validation is bad, Oliver Jaun](https://idontbyte.jaun.org/blog/2019/10/beanvalidation)
- [Always-Valid Domain Model, Vladimir Khorikov](https://enterprisecraftsmanship.com/posts/always-valid-domain-model/)
- [Classes vs. Data Structures, Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2019/06/16/ObjectsAndDataStructures.html)
