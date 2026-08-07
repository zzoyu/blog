---
title: "v-model 기반 데이터 바인딩 구현하기"
date: 2022-02-28
lastmod: 2026-08-07T12:58:00.000Z
categories: ["development"]
memo: true
tags: ["Vue.js","Nuxt.js","프론트엔드"]
---

> 💡 Vue2 기준이며, Vue3기준은 아래 글을 참조할 것!

> [https://stackoverflow.com/questions/66737918/how-to-use-v-model-on-component-in-vue-3-script-setup](https://stackoverflow.com/questions/66737918/how-to-use-v-model-on-component-in-vue-3-script-setup)
>


```html
<input
 v-bind:value="something"
 v-on:input="something = $event.target.value">
```

`v-model`은 위의 축약어이다. value값을 `props`로 받아오고, 이벤트가 발생하면 값을 별도로 업데이트 해주는 형태이다.

따라서, 하위 컴포넌트에서 모델으로 사용할 `prop`과 `event`를 선언하고, 등록한 이벤트를 상위로 쏘아올리면 상위 컴포넌트 내의 값 조작이 가능하다. UI 컴포넌트 개발에서 유용하게 사용할 수 있을 것으로 생각된다.

```javascript
model: {
    prop: 'value',
    event: 'change',
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },

//...

methods: {
    change(newValue: Boolean) {
      this.$emit('change', newValue)
    },
//....
```



