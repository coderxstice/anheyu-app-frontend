<template>
  <div
    class="an-select"
    :class="{ 'is-open': isOpen, 'is-disabled': disabled }"
  >
    <div
      ref="triggerRef"
      class="an-select-trigger"
      tabindex="0"
      @click="toggleDropdown"
      @keydown.enter.prevent="toggleDropdown"
      @keydown.space.prevent="toggleDropdown"
      @keydown.esc="closeDropdown"
    >
      <span class="an-select-value">{{ selectedLabel || placeholder }}</span>
      <i
        class="anzhiyufont anzhiyu-icon-chevron-down an-select-arrow"
        :class="{ 'is-reverse': isOpen }"
      />
    </div>

    <Teleport to="body">
      <Transition name="an-select-dropdown">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="an-select-dropdown"
          :style="dropdownStyle"
        >
          <div class="an-select-options">
            <div
              v-for="option in options"
              :key="option.value"
              class="an-select-option"
              :class="{
                'is-selected': modelValue === option.value,
                'is-disabled': option.disabled
              }"
              @click="handleSelect(option)"
            >
              <span class="option-label">{{ option.label }}</span>
              <i
                v-if="modelValue === option.value"
                class="anzhiyufont anzhiyu-icon-check option-check"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick
} from "vue";

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface Props {
  modelValue: string | number;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "请选择",
  disabled: false
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | number): void;
  (e: "change", value: string | number): void;
}>();

const isOpen = ref(false);
const triggerRef = ref<HTMLElement>();
const dropdownRef = ref<HTMLElement>();
const dropdownStyle = ref<any>({});

const selectedLabel = computed(() => {
  const option = props.options.find(opt => opt.value === props.modelValue);
  return option?.label || "";
});

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};

const handleSelect = (option: SelectOption) => {
  if (option.disabled) return;
  emit("update:modelValue", option.value);
  emit("change", option.value);
  closeDropdown();
};

// 计算下拉框位置
const updateDropdownPosition = () => {
  if (!triggerRef.value || !isOpen.value) return;

  nextTick(() => {
    const triggerRect = triggerRef.value!.getBoundingClientRect();
    const dropdownHeight = dropdownRef.value?.offsetHeight || 0;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // 决定向上还是向下展开
    const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    dropdownStyle.value = {
      position: "fixed",
      left: `${triggerRect.left}px`,
      top: showAbove
        ? `${triggerRect.top - dropdownHeight - 8}px`
        : `${triggerRect.bottom + 8}px`,
      width: `${triggerRect.width}px`,
      zIndex: 2001
    };
  });
};

// 点击外部关闭
const handleClickOutside = (event: MouseEvent) => {
  if (
    triggerRef.value &&
    !triggerRef.value.contains(event.target as Node) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target as Node)
  ) {
    closeDropdown();
  }
};

watch(isOpen, newVal => {
  if (newVal) {
    updateDropdownPosition();
    document.addEventListener("click", handleClickOutside);
    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);
  } else {
    document.removeEventListener("click", handleClickOutside);
    window.removeEventListener("scroll", updateDropdownPosition, true);
    window.removeEventListener("resize", updateDropdownPosition);
  }
});

onMounted(() => {
  // 确保组件正确初始化
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("scroll", updateDropdownPosition, true);
  window.removeEventListener("resize", updateDropdownPosition);
});
</script>

<style lang="scss" scoped>
.an-select {
  position: relative;
  display: inline-block;
  width: 100%;

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.6;

    .an-select-trigger {
      cursor: not-allowed;
    }
  }
}

.an-select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  padding: 0 12px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;
  background: var(--anzhiyu-card-bg);
  border: 1px solid var(--anzhiyu-card-border);
  border-radius: 8px;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--anzhiyu-main);
    box-shadow: 0 0 0 2px rgba(var(--anzhiyu-main-rgb), 0.1);
  }

  &:focus {
    border-color: var(--anzhiyu-main);
    box-shadow: 0 0 0 3px rgba(var(--anzhiyu-main-rgb), 0.15);
  }

  .an-select.is-open & {
    border-color: var(--anzhiyu-main);
    box-shadow: 0 0 0 3px rgba(var(--anzhiyu-main-rgb), 0.15);
  }
}

.an-select-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.an-select-arrow {
  margin-left: 8px;
  font-size: 12px;
  color: var(--anzhiyu-secondtext);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.is-reverse {
    transform: rotate(180deg);
  }
}

.an-select-dropdown {
  position: fixed;
  padding: 6px;
  overflow: hidden;
  background: var(--anzhiyu-card-bg);
  border: var(--style-border);
  border-radius: 12px;
  box-shadow:
    0 3px 6px -4px rgba(0, 0, 0, 0.12),
    0 6px 16px 0 rgba(0, 0, 0, 0.08),
    0 9px 28px 8px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(8px);
}

.an-select-options {
  max-height: 280px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--anzhiyu-secondtext);
    border-radius: 3px;
    opacity: 0.3;

    &:hover {
      background: var(--anzhiyu-fontcolor);
    }
  }
}

.an-select-option {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
  padding: 0 12px;
  font-size: 14px;
  color: var(--anzhiyu-fontcolor);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: var(--anzhiyu-fontcolor);
    background: rgba(var(--anzhiyu-main-rgb), 0.08);
  }

  &.is-selected {
    color: var(--anzhiyu-main);
    font-weight: 500;
    background: rgba(var(--anzhiyu-main-rgb), 0.1);

    &:hover {
      background: rgba(var(--anzhiyu-main-rgb), 0.15);
    }
  }

  &.is-disabled {
    color: var(--anzhiyu-lighttext);
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      background: transparent;
    }
  }
}

.option-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-check {
  margin-left: 8px;
  font-size: 14px;
  color: var(--anzhiyu-main);
}

// 下拉动画
.an-select-dropdown-enter-active {
  animation: an-select-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.an-select-dropdown-leave-active {
  animation: an-select-slide-out 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes an-select-slide-in {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes an-select-slide-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
}

// 移动端适配
@media (width <= 768px) {
  .an-select-trigger {
    min-height: 44px;
    font-size: 16px; // 防止 iOS 自动缩放
  }

  .an-select-option {
    min-height: 44px;
    font-size: 16px;
  }
}
</style>
