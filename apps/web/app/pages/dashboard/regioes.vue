<script setup lang="ts">
definePageMeta({ titulo: 'Ranking de regiões', permissao: 'dashboard.view' });
useHead({ title: 'Ranking de regiões — BI Metahospitalar' });
</script>

<template>
  <DashboardRankingPagina dim="regioes" />
</template>
