<template>

    <div>

    <button @click="signIn({ username: 'test', password: 'hunter2' })">BANG</button>

    <pre>{{ data }}</pre>

    </div>

</template>

<script setup lang="ts">

const {
  status,
  data,
  token,
  lastRefreshedAt,
  getSession,
  signUp,
  signIn,
  signOut,
} = useAuth()

</script>