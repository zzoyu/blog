---
title: "간단한 자카드 유사도"
date: 2023-11-15
lastmod: 2026-08-07T13:45:00.000Z
categories: ["development"]

tags: ["Data Science"]
---

> 💡 **TL;DR**

> $$
> \frac{∣A∩B∣}
> {∣A∪B∣}
> $$
>


# 자카드 유사도는 뭔가요?

자카드 유사도는 Jaccard similarity라고도 합니다. 집합이 서로 얼마나 일치하는지 알기 위해 사용합니다.

간단하게는 문장의 유사도를 알 수 있고, CV 분야에서는 이미지의 사물 감지에 사용되기도 합니다. 저의 경우 간단하게 특징에 대한 리스트를 서로 비교하는 용도로 사용해보려 합니다.



# 기본적인 원리

1. 토큰의 집합 A와 B가 있다고 가정합니다. 이 때, 두 집합의 합집합이 필요합니다. (물론 중복되지 않아야겠죠?) 두 집합이 함께 가진 토큰과 그렇지 않은 토큰이 모두 포함됩니다.
  ![image](https://prod-files-secure.s3.us-west-2.amazonaws.com/5a01f05c-ce64-4edc-8ebb-20ed300b7a52/6438328d-fe68-4102-b613-1473da75514a/union.svg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4665LG6IL2S%2F20260807%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260807T135117Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEI3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQDQlVgR0vtzagOBZoBEv%2FPIfiHVEeaIbJuBAJialZz7OwIhAPD8ekzUYfXwvOWHzH9dBt4EVdQP7vHk9zOkqkdJgKULKv8DCFYQABoMNjM3NDIzMTgzODA1IgxP4L5KkVU8Kx4c318q3APB%2Bk32smaJd%2BQp7z4u0TRuP0tBVumL4q44bTacJulC%2BbTCSsu%2BzdHoTLpQiDNTk3ONO%2F1ae%2FiaU0o7KCvKE%2F6dPOEfV%2B1sgm0pT9%2Bg3Z%2BpYjfv20uYqtIzEV826h2b92jN%2FMfJhLKKc%2FhU5KsdVeuvOwp9Tqs9mTw6PV4gkty97DUHDi5futMBqbawrq%2FTFxePEzut0%2BlbsXFTgc2BPx1Gz8ziYder0k0z4V3QPS5ouSRf8oS2xuHI1NNz2jkE8wEwv1zcvHe2ArYVXZ6o6YThVijd0%2FLX7YuaQ0kTtobodEBXC61b0sXkpQPythxG8WsIsyhkwQf3p1xWxxm%2BapzrEKOjm5TidwXb3UIOjSLIMSkgLJ8DnROsZxRNda0faWPfuSK4bPY7Dy0p8Fxkhd5C1Q9d%2BIkzbRLIq9n%2Fw%2BCv8rV9aLh%2Fd%2BdiXB%2Bs4JiKOH2tkH9BIl9miVRg%2FdIIhhQtuQLpPei4%2B1tHWqJxFNrWgXFGp3rM%2FQHGdg3GmFhKI43hOirXNtVSELTJ5a%2BQ7vZlVDdMzyxeqqXcPOmfU4L3R%2BZOGMtGV092PJ7EuHCjWLZtubt2GAeQel%2BK5d1Z46mKSae7ch6C7LYzy4tL1NuyW2m8Ijc1gPqrhsuC9DDisNfTBjqkASZjydkc2C0BENZcxcm5PAnSc9%2B9L3FxljmO%2BZuEI5VzvSncLhZffK%2BIeRn%2F0e4z%2BKhbO3Bapkxg%2B3J1HHOiSNRWRaWRby8nG6eA171nzDDBeyFmsILjqZNOgJOv%2FKh8PRMZhj0paXihV2N3P7GH6wZhXfIYdC7VAuB8C0qJm88WCwYJgA9%2FfNpluuxnWXyKNwAFX%2FB7b0WXYMGn3SB1XWq7iJjA&X-Amz-Signature=d7bde756810f21130ad7f7047a59d2df6a820c480167e76ba59cc69115024792&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

1. 그리고 교집합 또한 필요합니다. 두 집합이 동시에 갖는 토큰만 해당합니다.
  ![image](https://prod-files-secure.s3.us-west-2.amazonaws.com/5a01f05c-ce64-4edc-8ebb-20ed300b7a52/55aba5b7-496a-46c2-9564-91f0a50a6aa1/intersection.svg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466QWUSJIK3%2F20260807%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260807T135117Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEI3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDBiEg5BHYaAnwVUoR0Wl%2FWraHIwvoqcSxdFvX1V10R0AIgCtmW7NiXrimH8rnb4ZqBChmlfGdIkPkSfFbatHSGv%2Bcq%2FwMIVhAAGgw2Mzc0MjMxODM4MDUiDPKUkm6ZtBmTJmMjRyrcAzTiLHxWd2wk1nzMXHQyv6gFYVuWQT3AN%2Fp3IMKnx31mVAim5TdFtfFbOkkRFpxTGmv9o6Bo3%2BT9gcjsupfkTdPpQCbxACso6cP0PMNhH1Nuj6HLvIsbh7Uftcs8Nw%2FLnR0nTjYlM5k%2F45RKfcIHyxEviOhKV7H3ElD4jzIE3Hs49J%2BTwmg7UW45DvT2MECUhwgewGC3aNTG3MVOikYlvTudnhUmZaZn5UMLfNikDNaObZOB5xu6Is8dt9ISlIqRERxnROX3rRUm8bEnTuAIoFQPZzVWyYPVXDe33JsG7mvUMDOxZm26mvIut9%2FsYt1o9ucRdpF7vUWJ5q75ptrsgNSyBOjMTkY4B8mZpETjSaA%2BwtTSLSm%2FERXBQXety%2FP9PnpO5IyBAPFa0RQQ9dD043s8bLlEG2nE8av5vWRB%2BzdqYf4TAn84lCRI%2FlJDADUEYrAa%2FkUlak5vUt8Xe%2FfJU0u98w10x1V8ZIU2MCLiwdCMFWwO8VXj2iCTMBUU1%2BXlaa%2B67aBEpLRIg3PSgbnTbVHBpJ0i41QTX%2Bv6tDuv8KZwJUVguefdq6owqRPtRm9Ez%2BVWTB9JBu4T47ehPP3ZOeR45EQChWe9oWJF8CgldVJaGjN1fDosoLYAQnYvMMWu19MGOqUBXAeqAN64tiLszdvE4cI4%2BjGfJ%2Bac5iicy3vjGfbc8FRPs5rYTpNF%2BwGV%2FsJUGVVQ01cPyRbi2X96V0iO2m2%2FvUkjNSwT3Co4unek0KydlzodFLu%2Bizj6GZ7WP22MbaEaGFsn3RWbYCZp48aO3yM6lX%2FDyzbIWklDWWQq%2BeVrpigPpPn2b01tf35KbptVCbr3dMAl9ZEdMDiM3DqjWYkPaQAE66Nq&X-Amz-Signature=38bc25c0c6e09ead18526d55d11e6c83cde0d4efebf730caf8a3db703abf16e2&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

1. 이게 끝입니다. 자카드 유사도는 $\frac{∣A∩B∣}
{∣A∪B∣}$입니다. 각각의 개수를 나누면 됩니다. 백분율로 표기해야한다면 곱하기 100을 하면 됩니다.


# 실제의 적용

다음의 데이터 집합이 있다고 가정해 봅시다.

    - 신라면
      - 매움
      - 짬
      - 라면
      - 국물
      - 면요리
      - 음식
    - 짜파게티
      - 닮
      - 짬
      - 라면
      - 볶음
      - 면요리
      - 음식
    - 페리오 치약
      - 매움
      - 개운함
      - 생필품
      - 구강건강
      - 건강용품
    - 백짬뽕
      - 매움
      - 개운함
      - 라면
      - 국물
      - 면요리
      - 음식
여기서 신라면과 유사한 건 무엇일까요?

신라면 하면 떠오르는 특징은 “매움”입니다. 그럼 페리오 치약도 매운데요, 유사한 상품이라고 할 수 있을까요? 유사함의 정도를 어떻게 수치로 나타내나요?

여기서 제일 간단하게 구현할 수 있는 것은 자카드 유사도입니다. 앞서 언급한 대로 자카드 유사도를 구하고, 결과를 도표 형태로 그려보도록 하겠습니다.

![image](https://prod-files-secure.s3.us-west-2.amazonaws.com/5a01f05c-ce64-4edc-8ebb-20ed300b7a52/9747fa19-9664-4f97-a379-b7d61064850e/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466UQLQ6BC7%2F20260807%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260807T135117Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEI3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQClpYJHpExix%2B%2Blwe%2FjoVu694yqKJK6SmUdpTHKHTUBQwIgLAmbTPqnJpGPd5QS8XU3%2BBHdGpDkIh31RsD3J1%2BUHRQq%2FwMIVhAAGgw2Mzc0MjMxODM4MDUiDHHZfdEzKU6Rrz6YqircA%2Fy54ZlUKUAfitJ8T3xmiyROOp8pJROwgwa10hLhR1kV9mqRO3ABNMkMiCLhx4K%2Bli2ML8RPLrqVo7QaReP2BHTSLozLMJJ%2Bdd2dS%2BS2qVSJBNkXGq8B6k7m%2BfLrXzxzDpoLk%2B8wgbn7evMsJYk520%2BoZKr7CHSauwNr76ml7w6GX%2BojM%2F%2BkOHDqeE%2FWJERCLsDFBOb9AUCGO40XeHPiKFiXhxAnhchwbNudCQUD5oqaYcDJ15cQyLsTpbfXyGRjK0m2bSIxUC6OgqLcsaTGP3UM7uWOlCc74ZUgPztRkBsvhe8D3LBj9PqkzmKybSGqQvdvmCNDowfTEcLIQHeIRTLUzK894BtNbEkgceNaqN9H9fWwJhtEmNtoTK%2Bdx%2BDoRUOn1Rvu1H1vZKabs%2BxHTT6tONcz1M4PRbRYxOSzVmBww5WMs4%2BZPs4ZfX7KgW31P%2BBkpRoVGg6kynXQ%2F9n4VMM4rs6ri9ELHnzdQH1gcZFuHK4i4wYJl3FW6Lp96HiR%2BXwDUk4yRe18Tfga5M9cNv5sHhkz51WgXCrVixeww97N4FgbM6qJNzon8abOkTs6xTKLiE0YgIpdN3k55gbAz%2BW9zdfUQKhqjwkTgolrbWEmJSDSkGoklZvUsYgTMMKw19MGOqUBB1tQtir83zZ3w009twhuAlF6YFRqNo1zRcxBEhOowYLTWlOGv41d0gw%2BQK56Q6NynPYwvFgoD7lh8tHC6sD%2BxNrmHiUziVVavXCTi8QmqOHyIuYwswDVwyKFn4bU9TJOGDD4aEafC0M47%2FzQAISABeFLLvhr5ZUcB%2B1GE7MWfIuXMS0QmS6mOML6Pk%2BcjAqLngvE79YL9gTt3I555TbdUgcwSfoy&X-Amz-Signature=b0784f71947e487ff819941a7222042b0473290c4ae6be55a09f55fd4e464168&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)



각각의 행, 열은 집합, 각 칸은 그에 대응하는 유사도 값입니다. 가운데 대각선은 동일한 집합을 비교하기 때문에 항상 1이며, 유사도는 순서와 상관 없으므로 모든 칸을 구하지 않아도 동일한 결과를 얻을 수 있습니다. 비교할 집합의 개수가 많다면 최적화 해보세요.

