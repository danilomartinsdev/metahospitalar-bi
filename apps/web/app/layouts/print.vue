<template>
  <!-- Layout do PDF (ADR 0004): sem sidebar, sem interação, fundo claro, largura de A4. -->
  <div class="min-h-screen bg-background text-foreground">
    <main class="mx-auto w-[190mm] py-2">
      <slot />
    </main>
  </div>
</template>
