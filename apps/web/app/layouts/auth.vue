<template>
  <div class="relative flex min-h-dvh items-center justify-center bg-background px-4 py-12">
    <div class="absolute right-4 top-4"><LayoutThemeToggle /></div>
    <div class="w-full max-w-[400px]">
      <div class="mb-8 flex justify-center">
        <img
          src="/brand/logo-meta-hospitalar.webp"
          alt="Meta Hospitalar"
          class="h-14 w-auto dark:brightness-0 dark:invert"
        />
      </div>
      <div class="rounded-xl border bg-card p-6 md:p-8">
        <slot />
      </div>
    </div>
  </div>
</template>
