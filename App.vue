<script>
	

import AppUpdate from '@/pages/utils/update.js';


export default {
    data() {
        return {};
    },
    onLaunch: function () {
		
		AppUpdate.getInstance().checkUpdate();
        
    },
    globalData: {
        // 全局数据
    }
};
</script>
<style>
@import './app.css';
</style>
