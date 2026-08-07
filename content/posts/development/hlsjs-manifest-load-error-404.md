---
title: "hls.js manifest load error 404 출력 시 리트라이."
date: 2021-08-19
lastmod: 2026-08-07T13:09:00.000Z
categories: ["development"]

tags: ["Javascript","업무","프론트엔드"]
---

> 🔥 **요약: 내가 아무리 리트라이를 설정해줘도 시도하지 않음. 그냥 다시 loadSource할 것.**

hls.js 공식 API 문서를 보면, manifest 관련 retry 설정이 존재한다. `manifestLoadingTimeOut` `manifestLoadingMaxRetry` `manifestLoadingRetryDelay` `manifestLoadingMaxRetryTimeout`가 그것이다.

그런데 이상한 점이 있다. 만약 m3u8링크를 loadSource 시도하였으나 실패했을 때 fatal 오류, 타입은 NETWORK_ERROR로 분류되어 있다. 공식 문서에서 fatal오류는 라이브러리 단에서 **자동 회복이 불가능**한 오류일 때 직접 에러 컨트롤링을 해주어야 한다고 설명한다. 그러므로 상기한 retry설정은 애초에 fatal 오류에서는 동작하지 않는다는 것을 유추할 수 있다.

그럼 fatal 오류는 어떻게 하는가? 이또한 해당 API 문서에서 네트워크 에러 컨트롤링에 대해 다음과 같이 기술하고 있다.

```javascript
switch (data.type) {
	case Hls.ErrorTypes.NETWORK_ERROR:
		*this.hls.startLoad();
	...*
```

그런데 저 코드는 동작하지 않는다는 것을 쉽게 알 수 있다. retry설정 문제인가 싶어 정말 온갖 수단과 방법을 가리지 않고(심지어 로더/콜백 재정의까지 했음) 시도하였으나 그어떤 부분도 타고 들어가지 않았음.

결론부터 말하자면 404의 경우 startLoad로 해결이 불가능하다.

이유는 xhr 로딩 시 onSuccess가 발생하지 않았을 때 retry를 시도한다고 생각했으나 400-499번대 오류의 경우 retry를 아예 시도하지 않는 fatal중의 fatal에러로 빠지게 된다!!!

온갖 설정값이나 콜백을 지정해도 문제가 발생하는 이유는 여기에 있었다.

```javascript
if (status >= 200 && status < 300) {
	stats.loading.end = Math.max(self.performance.now(), stats.loading.first);
  ...
	var response = {
		url: xhr.responseURL,
		data: data
	};
	this.callbacks.onSuccess(response, stats, context, xhr);
} else {
**// if max nb of retries reached or if http status between 400 and 499 (such error cannot be recovered, retrying is useless), return error**
if (stats.retry >= config.maxRetry || status >= 400 && status < 499) {
	_utils_logger__WEBPACK_IMPORTED_MODULE_0__["logger"].error(status + " while loading " + context.url);
	this.callbacks.onError({
		code: status,
		text: xhr.statusText
	}, context, xhr);
} else {
	// retry
	_utils_logger__WEBPACK_IMPORTED_MODULE_0__["logger"].warn(status + " while loading " + context.url + ", retrying in " + this.retryDelay + "..."); // abort and reset internal state
	this.abortInternal();
	this.loader = null; // schedule retry

	self.clearTimeout(this.retryTimeout);
	this.retryTimeout = self.setTimeout(this.loadInternal.bind(this), this.retryDelay); // set exponential backoff

	this.retryDelay = Math.min(2 * this.retryDelay, config.maxRetryDelay);
	stats.retry++;
}
```

> **// if max nb of retries reached or if http status between 400 and 499 (such error cannot be recovered, retrying is useless), return error**

