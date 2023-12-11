<template>

    <button @click="signIn({ username: 'jsmith', password: 'hunter2' })"></button>

    <pre>{{ data }}</pre>

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