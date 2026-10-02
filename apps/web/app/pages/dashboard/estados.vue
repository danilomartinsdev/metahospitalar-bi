<script setup lang="ts">
definePageMeta({ titulo: 'Ranking de estados', permissao: 'dashboard.view' });
useHead({ title: 'Ranking de estados — BI Meta Hospitalar' });
</script>

<template>
  <DashboardRankingPagina dim="estados" />
</template>
