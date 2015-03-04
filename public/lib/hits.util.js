hits_util = {
        getRoot: function() {
                if (hm_config.root) return hm_config.root;
                var root = hm_util.scriptUrl();
                return root.substring(0, root.length - 4)
        }
};
