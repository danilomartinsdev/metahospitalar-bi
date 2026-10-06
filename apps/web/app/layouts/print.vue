<script setup lang="ts">
// O body da SPA usa o cinza da tela (--background); no PDF a folha inteira é branca.
useHead({ bodyAttrs: { class: 'bg-card' } });
</script>

<template>
  <!-- Layout do PDF (ADR 0004): sem sidebar, sem interação, largura de A4. Fundo branco (--card) igual às
       margens da folha — com o cinza da tela, a página saía com uma "caixa" cinza e bordas brancas. -->
  <div class="bg-card text-foreground">
    <main class="mx-auto w-[190mm] py-2">
      <slot />
    </main>
  </div>
</template>
