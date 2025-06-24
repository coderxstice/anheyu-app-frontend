<template>
  <div class="file-toolbar rounded-2xl overflow-hidden bg-white">
    <div class="right-actions">
      <el-tooltip content="刷新" placement="bottom">
        <div>
          <el-button circle :icon="Refresh" @click="refresh" />
        </div>
      </el-tooltip>

      <el-dropdown trigger="click" placement="bottom-end">
        <el-button circle :icon="FullScreen" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="fileStore.selectAll"
              >全选</el-dropdown-item
            >
            <el-dropdown-item
              :disabled="fileStore.selectedFiles.size === 0"
              @click="fileStore.clearSelection"
              >取消选择</el-dropdown-item
            >
            <el-dropdown-item @click="fileStore.invertSelection"
              >反选</el-dropdown-item
            >
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-tooltip content="更多操作" placement="bottom">
        <div>
          <el-button circle :icon="MoreFilled" />
        </div>
      </el-tooltip>

      <el-button-group class="view-switcher">
        <div>
          <el-button
            :type="viewMode === 'grid' ? 'primary' : 'default'"
            :icon="Grid"
            @click="setView('grid')"
          />
          <el-button
            :type="viewMode === 'list' ? 'primary' : 'default'"
            :icon="Tickets"
            @click="setView('list')"
          />
        </div>
      </el-button-group>

      <el-popover
        placement="bottom-end"
        title="列设置"
        :width="250"
        trigger="click"
      >
        <template #reference>
          <div>
            <el-tooltip content="视图设置" placement="bottom">
              <div>
                <el-button circle :icon="Operation" />
              </div>
            </el-tooltip>
          </div>
        </template>
        <div>
          <span>分页大小</span>
          <el-slider v-model="pageSize" :min="50" :max="2000" show-input />
        </div>
      </el-popover>

      <el-tooltip content="排序" placement="bottom">
        <div>
          <el-button circle :icon="Sort" />
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useFileStore } from "@/store/modules/fileStore";
import {
  Refresh,
  MoreFilled,
  Grid,
  Tickets,
  Operation,
  Sort,
  FullScreen
} from "@element-plus/icons-vue";

const fileStore = useFileStore();
const viewMode = computed(() => fileStore.viewMode);
const pageSize = ref(50);

const setView = (mode: "list" | "grid") => {
  fileStore.setViewMode(mode);
};

const refresh = () => {
  fileStore.loadFiles(fileStore.path);
};
</script>

<style scoped>
.file-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 24px;
  background-color: #fff;
  border: var(--style-border);
}
.left-actions,
.right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.view-switcher {
  margin: 0 8px;
}
</style>
