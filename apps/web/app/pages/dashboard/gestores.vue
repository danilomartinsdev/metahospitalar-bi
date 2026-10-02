<script setup lang="ts">
definePageMeta({ titulo: 'Ranking de gestores', permissao: 'dashboard.view' });
useHead({ title: 'Ranking de gestores — BI Meta Hospitalar' });
</script>

<template>
  <DashboardRankingPagina dim="gestores" />
</template>
