---
title:  "그래서 나는 Bean Validation을 그만두었다."
description: "블로그를 만든 큰 이유 중 하나. 이 글이 쓰고 싶었다."
publishedAt: "2026-04-15"
updatedAt: "2026-04-15"
tags: ["spring", "validation"]
draft: false
locale: "ko"
slug: "gave-up-bean-validation"
---

## 0. 제목의 출처
노래는 `요루시카`의 `나는 그래서 음악을 그만두었다`  

<iframe
src="https://www.youtube.com/embed/KTZ-y85Erus"  
title="YouTube video player"  
loading="lazy"
referrerpolicy="strict-origin-when-cross-origin"                                                      
allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
allowfullscreen>
</iframe>

## 1. 입력값 유효성 검증과 Bean Validation
백엔드 / 서버 개발을 하다보면 한 번쯤은 사용자의 입력 값에 대한 유효성 검증이 필요해진다.  
회원가입, 로그인, 게시글 작성처럼 외부로부터 데이터를 받는 모든 API는, 들어오는 값이 기대한 형태인지 반드시 확인해야 한다.  

Java / Spring 진영에서는 이 검증을 Java Bean Validation 이라는 걸 통해 비교적 간단한게 처리할 수 있다.
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
