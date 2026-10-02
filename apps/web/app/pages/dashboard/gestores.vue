<script setup lang="ts">
definePageMeta({ titulo: 'Ranking de representantes', permissao: 'dashboard.view' });
useHead({ title: 'Ranking de representantes — BI Meta Hospitalar' });
</script>

<template>
  <DashboardRankingPagina dim="gestores" />
</template>
