---
title: "EncryptedSharedPreferences"
date: 2021-10-14
lastmod: 2026-08-07T13:09:00.000Z
categories: ["development"]

tags: ["Android","Kotlin"]
---

### 개요

안드로이드는 SharedPreferences를 사용하면 xml파일로 내용이 평문 저장된다. 민감한 값을 보관한다면 위험한 행동이 될 수 있으므로, 암호화하여 저장하는 EncryptedSharedPreferences를 사용하도록 하자.

### 절차

1. dependencies 추가
  `implementation 'androidx.security:security-crypto-ktx:1.1.0-alpha03'`

1. put
  ```kotlin
  var masterKey:MasterKey = MasterKey.Builder(applicationContext, MasterKey.DEFAULT_MASTER_KEY_ALIAS)
																.setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
																.build()
var sharedPreferences = EncryptedSharedPreferences.create(applicationContext, "filename", masterKey, EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV, EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM)
sharedPreferences.edit()
			.putString("name", "value")
			.commit()
  ```

1. get
  ```kotlin
  var masterKey = MasterKey.Builder(applicationContext, MasterKey.DEFAULT_MASTER_KEY_ALIAS)
										.setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
										.build()
var sharedPreferences = EncryptedSharedPreferences
												.create(applicationContext, "filename", masterKey, EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV, EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM)
sharedPreferences.getString("name", "default")
  ```

