---
title: "slot값이 있을 때만 특정 엘레먼트 보여주기"
date: 2022-03-02
lastmod: 2026-08-07T12:57:00.000Z
categories: ["development"]
memo: true
tags: ["Vue.js","Nuxt.js","프론트엔드"]
---

slot 값들은 `this.$slots`내에 들어있다. name이 없는 기본 슬롯의 경우 `this.$slots.default`가 된다.

따라서, **<p *****v-if=”$slots.default”*****><slot></slot></p>** 형태로 선언하면 기본 슬롯 값이 설정될 때에만 컴포넌트를 렌더링 할 수 있다.

![image](https://prod-files-secure.s3.us-west-2.amazonaws.com/5a01f05c-ce64-4edc-8ebb-20ed300b7a52/ffaf49b1-dd0c-4db6-a349-51f1f40b4cfc/Untitled.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466QESSIPK4%2F20260807%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260807T135121Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEI3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQD7JDn4mJx35sYJhBs0uDkiOvTaFUtvPjpt%2BTyl7cvYnAIhAIagEdgIc77y7EhleuLLauIlaV1sIQW3i72z52FUyImdKv8DCFYQABoMNjM3NDIzMTgzODA1Igxc6PmrFv8%2BoEqRXlQq3AOYeAq82I2bUPt5AHeXcu0uldGMcIf5JpUBdboZsZ4VdS1PcTlOcSE8PLUBilUBD9StmSooOSNFQ3uUHIcYAihTYSBs7hAkfqmi6NFXljx4wa5mTI5zuaQdGIAn3LNH78UHEzpuLOlbCQ%2FOYzXR7ETwJOsCMo73gFNbk4x7fhR86ekkTvZ1CFLRf1uoqBe7N%2FYo3sevp7OFky%2BPeqkSIuAZi1yCsVBy4W2QHLQhSU5hW9Cm0cguW662C2M%2Fk4KuYuE60W%2BPx71uj0dbOqV7I0P0xsRhXFb0rKQ9YW4dMcPuB9N8z6Ufv0gHMkXsYkr%2F4CxUJ9qy8r0cwd98qNreP5dlWlpr3CM6SzQBNtZ6by6FfC2SR1A08pfol8Ts25AGuh%2BSctI3Yl0OgpQhRwWbm2RuCsxmUCTOJsBzclP9ganHsiSeKLv47CwzDPkMge3VMoXmCX746NzNUCmFPhYMm1%2BpKHZIDQ0szm0suBc3FrvJjKGh7epD5NKgzOAxGmTeYj%2BwUGzgvH6AePOhr4ehxL0hC6iUvkUJ4nXBV7Wa7iZzdN6oQmxxeqRorKNA3nf9gvL1hpDM0vECXZx45ikJSTX0VjB%2BQ8hhr%2BvI7WU3pklwp7X8zzDRwUdOh6LIVzDZsNfTBjqkAZiokMEra1ge1G%2FrmYjcnT630P2PBoqYeB1yky2zC1%2BDEbhOnxcQV4eblSaURQUk4p%2BPJlWrmBbl1g4zm6gxQN2jobc4BxcBoXV6%2FNeblguS5U%2BbfgcTupPSzAB%2BDCm4z%2FtxaGXPGeio69ev88mO9F38qbPBquVdanK9ukDyoC9vOnD09H6Q20OxFWZJOw2yNGlg80WT%2FfryjqhTWW3%2Fyx2kZ3yw&X-Amz-Signature=a79e9296850f5e12f1388c3fc860b0dd530b718788811ef4561a06b3cacfda9c&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

그러면 위와 같은 결과를 얻을 수 있다.

위의 것은 `<component />` 형태이고, 아래 것은 `<component>어쩌구저쩌구</component>`로 지정한 예시이다.

