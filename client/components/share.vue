<template>
    <span v-if="isSignedIn" class="headerItem hasPopover">
        <PopoverHover id="share" @shown="focusShare">
            <template #target><i class="lpSprite lpLink" /> Share</template>
            <template #content>
                <div class="lpFields">
                    <div class="lpField">
                        <label for="shareUrl">Share your list</label>
                        <input
                            id="shareUrl"
                            v-select-on-bus="'show-share-box'"
                            v-select-on-focus
                            type="text"
                            :value="shareUrl"
                        />
                    </div>
                    <div class="lpField">
                        <label for="embedUrl">Embed your list</label>
                        <textarea id="embedUrl" v-select-on-focus :value="embedCode" readonly />
                    </div>
                    <a id="csvUrl" :href="csvUrl" target="_blank" class="lpHref"
                        ><i class="lpSprite lpSpriteDownload" />Export to CSV</a
                    >
                </div>
            </template>
        </PopoverHover>
    </span>
</template>

<script>
import PopoverHover from './popover-hover.vue';

export default {
    name: 'Share',
    components: {
        PopoverHover,
    },
    computed: {
        library() {
            return this.$store.library;
        },
        list() {
            return this.library.getListById(this.library.defaultListId);
        },
        isSignedIn() {
            return this.$store.loggedIn;
        },
        externalId() {
            return this.list.externalId || '';
        },
        baseUrl() {
            const location = window.location;
            return location.origin ? location.origin : `${location.protocol}//${location.hostname}`;
        },
        shareUrl() {
            if (this.externalId) {
                return `${this.baseUrl}/r/${this.externalId}`;
            }
            return '';
        },
        csvUrl() {
            if (this.externalId) {
                return `${this.baseUrl}/csv/${this.externalId}`;
            }
            return '';
        },
        embedCode() {
            return `<script src="${this.baseUrl}/e/${this.externalId}"><\/script><div id="${this.externalId}"></div>`;
        },
    },
    methods: {
        focusShare(evt) {
            if (!this.list.externalId) {
                fetchJson('/externalId', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'same-origin',
                })
                    .then((response) => {
                        this.$store.setExternalId({ externalId: response.externalId, list: this.list });
                        setTimeout(() => {
                            bus.$emit('show-share-box');
                        }, 0);
                    })
                    .catch((response) => {
                        alert('An error occurred while attempting to get an ID for your list. Please try again later.'); // TODO
                    });
            }
            bus.$emit('show-share-box');
        },
    },
};
</script>

<style lang="scss">
#share label {
    font-weight: bold;
}
</style>
