<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery } from '@pinia/colada';
import { searchStays } from '#/api/search';
import type { SearchQuery, SearchResult } from '#/api/search';
import { Button } from '#/core/components/ui/button';
import { Input } from '#/core/components/ui/input';
import { Skeleton } from '#/core/components/ui/skeleton';
import { Badge } from '#/core/components/ui/badge';
import { cn } from '#/lib/utils';

const route = useRoute();
const router = useRouter();

const STORAGE_KEY = 'guest-search-filters';

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isoDateFromToday(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toLocalISODate(d);
}

const DEFAULT_FILTERS: SearchQuery = {
  location: '',
  checkIn: isoDateFromToday(0),
  checkOut: isoDateFromToday(3),
  guests: 1,
};

function readFiltersFromQuery(): SearchQuery | null {
  const q = route.query;
  const hasAny = ['location', 'checkIn', 'checkOut', 'guests'].some(
    (k) => q[k] !== undefined && q[k] !== '',
  );
  if (!hasAny) return null;
  return {
    location: typeof q.location === 'string' ? q.location : '',
    checkIn: typeof q.checkIn === 'string' ? q.checkIn : '',
    checkOut: typeof q.checkOut === 'string' ? q.checkOut : '',
    guests: q.guests ? Number(q.guests) : 1,
  };
}

function readFiltersFromStorage(): SearchQuery | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SearchQuery> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      location: typeof parsed.location === 'string' ? parsed.location : '',
      checkIn: typeof parsed.checkIn === 'string' ? parsed.checkIn : '',
      checkOut: typeof parsed.checkOut === 'string' ? parsed.checkOut : '',
      guests: typeof parsed.guests === 'number' ? parsed.guests : 1,
    };
  } catch {
    return null;
  }
}

function resolveInitialFilters(): SearchQuery {
  return readFiltersFromQuery() ?? readFiltersFromStorage() ?? { ...DEFAULT_FILTERS };
}

const initialFilters = resolveInitialFilters();

const filters = reactive({
  location: initialFilters.location ?? '',
  checkIn: initialFilters.checkIn ?? '',
  checkOut: initialFilters.checkOut ?? '',
  guests: initialFilters.guests ?? 1,
  priceMin: undefined as number | undefined,
  priceMax: undefined as number | undefined,
  amenities: '',
});

const canSearch = computed(() => !!filters.checkIn && !!filters.checkOut);

function buildQuery(page: number): SearchQuery {
  return {
    location: filters.location.trim(),
    checkIn: filters.checkIn,
    checkOut: filters.checkOut,
    guests: filters.guests,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    amenities: filters.amenities
      ? filters.amenities
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean)
      : undefined,
    page,
  };
}

const appliedQuery = ref<SearchQuery | null>(null);

const { data, isLoading, error, refetch } = useQuery({
  key: () => ['guest-search', appliedQuery.value],
  query: () => searchStays(appliedQuery.value ?? {}),
  enabled: () => appliedQuery.value !== null,
});

const stays = ref<SearchResult[]>([]);
const page = ref(1);
const totalPages = ref(0);
const totalRecords = ref(0);
const isLoadingMore = ref(false);

watch(data, (result) => {
  if (!result) return;
  stays.value = result.data;
  page.value = result.meta.page;
  totalPages.value = result.meta.totalPages;
  totalRecords.value = result.meta.totalRecords;
});

function persistFilters(query: SearchQuery) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        location: query.location ?? '',
        checkIn: query.checkIn ?? '',
        checkOut: query.checkOut ?? '',
        guests: query.guests ?? 1,
      }),
    );
  } catch {}
}

function syncUrlToQuery(query: SearchQuery) {
  const target: Record<string, string> = {};
  if (query.location) target.location = query.location;
  if (query.checkIn) target.checkIn = query.checkIn;
  if (query.checkOut) target.checkOut = query.checkOut;
  if (query.guests) target.guests = String(query.guests);

  const current = route.query as Record<string, string | string[] | undefined>;
  const currentKeys = Object.keys(current).filter((k) => current[k] !== undefined);
  const targetKeys = Object.keys(target);
  const same =
    targetKeys.length === currentKeys.length &&
    targetKeys.every((k) => String(current[k]) === target[k]);
  if (!same) {
    router.replace({ query: target });
  }
}

function runSearch(pageNum: number) {
  const query = buildQuery(pageNum);
  appliedQuery.value = query;
  persistFilters(query);
}

function onSubmit() {
  if (!canSearch.value) return;
  runSearch(1);
  if (appliedQuery.value) syncUrlToQuery(appliedQuery.value);
}

async function loadMore() {
  if (!appliedQuery.value || page.value >= totalPages.value || isLoadingMore.value) return;
  isLoadingMore.value = true;
  try {
    const result = await searchStays(buildQuery(page.value + 1));
    stays.value = [...stays.value, ...result.data];
    page.value = result.meta.page;
    totalPages.value = result.meta.totalPages;
    totalRecords.value = result.meta.totalRecords;
  } catch (e) {
    console.error(e);
  } finally {
    isLoadingMore.value = false;
  }
}

runSearch(1);

onMounted(() => {
  if (appliedQuery.value) syncUrlToQuery(appliedQuery.value);
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="mb-6 text-2xl font-bold">Guest home</h1>

    <!-- Search form -->
    <form
      class="mb-8 grid grid-cols-1 gap-3 rounded-xl border border-input p-4 sm:grid-cols-2 lg:grid-cols-6"
      @submit.prevent="onSubmit"
    >
      <Input v-model="filters.location" placeholder="Where to?" class="lg:col-span-2" />
      <Input v-model="filters.checkIn" type="date" />
      <Input v-model="filters.checkOut" type="date" />
      <Input v-model.number="filters.guests" type="number" min="1" placeholder="Guests" />
      <Input v-model.number="filters.priceMin" type="number" min="0" placeholder="Min price" />
      <Input v-model.number="filters.priceMax" type="number" min="0" placeholder="Max price" />
      <Input
        v-model="filters.amenities"
        placeholder="Amenities (comma-separated)"
        class="sm:col-span-2 lg:col-span-4"
      />
      <Button type="submit" :disabled="!canSearch" class="lg:col-span-2">Search</Button>
    </form>

    <!-- Loading (initial) -->
    <div
      v-if="isLoading && stays.length === 0"
      class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
    >
      <div v-for="i in 6" :key="i" class="space-y-3 rounded-xl border border-input p-4">
        <Skeleton class="aspect-4/3 w-full rounded-lg" />
        <Skeleton class="h-4 w-2/3" />
        <Skeleton class="h-3 w-1/2" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="py-10 text-center">
      <p class="text-destructive">Failed to load stays.</p>
      <Button class="mt-4" variant="outline" @click="refetch">Retry</Button>
    </div>

    <!-- Empty -->
    <div
      v-else-if="appliedQuery && stays.length === 0"
      class="py-10 text-center text-muted-foreground"
    >
      No stays found for these filters.
    </div>

    <!-- Prompt before first search -->
    <div v-else-if="!appliedQuery" class="py-10 text-center text-muted-foreground">
      Enter a location and dates to search.
    </div>

    <!-- Results -->
    <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="stay in stays"
        :key="stay.roomType.roomTypeId"
        :class="
          cn(
            'rounded-xl border border-input bg-background p-4 shadow-xs transition-shadow hover:shadow-md',
          )
        "
      >
        <div
          class="mb-3 flex aspect-4/3 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground"
        >
          No photo
        </div>
        <h3 class="line-clamp-1 text-lg font-semibold">{{ stay.hotel.name }}</h3>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ stay.hotel.location }} · {{ stay.roomType.name }}
        </p>
        <div v-if="stay.roomType.amenities?.length" class="mt-2 flex flex-wrap gap-1">
          <Badge v-for="amenity in stay.roomType.amenities" :key="amenity" variant="secondary">
            {{ amenity }}
          </Badge>
        </div>
        <div class="mt-3 flex items-baseline justify-between">
          <span class="text-lg font-semibold">
            {{ Number(stay.totalPrice).toLocaleString() }}
            <span class="text-sm font-normal text-muted-foreground">total</span>
          </span>
          <span class="text-xs text-muted-foreground">{{ stay.roomsAvailable }} left</span>
        </div>
      </div>
    </div>

    <div v-if="appliedQuery && page < totalPages" class="flex justify-center py-8">
      <Button variant="secondary" :disabled="isLoadingMore" @click="loadMore">
        {{ isLoadingMore ? 'Loading…' : `Load more (${stays.length} of ${totalRecords})` }}
      </Button>
    </div>
  </div>
</template>
