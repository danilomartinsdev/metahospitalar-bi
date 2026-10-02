<script setup lang="ts">
definePageMeta({ titulo: 'Ranking de regiões', permissao: 'dashboard.view' });
useHead({ title: 'Ranking de regiões — BI Meta Hospitalar' });
</script>

<template>
  <DashboardRankingPagina dim="regioes" />
</template>
