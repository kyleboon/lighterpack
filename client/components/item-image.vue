<template>
    <div>
        <modal id="itemImageDialog" :shown="shown" @hide="shown = false">
            <div class="columns">
                <div class="lpHalf">
                    <h2>Add image by URL</h2>
                    <form id="itemImageUrlForm" @submit.prevent="saveImageUrl()">
                        <input id="itemImageUrl" v-model="imageUrl" type="text" placeholder="Image URL" />
                        <input type="submit" class="lpButton" value="Save" />
                        <a class="lpHref close" @click="shown = false">Cancel</a>
                    </form>
                </div>
                <div class="lpHalf">
                    <h2>Upload image from disk</h2>
                    <template v-if="!item.image">
                        <p class="imageUploadDescription">Your image will be hosted on imgur.</p>
                        <button id="itemImageUpload" class="lpButton" @click="triggerImageUpload">Upload Image</button>
                        <a class="lpHref close" @click="shown = false">Cancel</a>
                        <p v-if="uploading">Uploading image...</p>
                    </template>
                    <template v-if="item.image">
                        <button id="itemImageUpload" class="lpButton" @click="removeItemImage">Remove Image</button>
                    </template>
                </div>
            </div>
        </modal>
        <form id="imageUpload" ref="imageUploadForm">
            <input id="image" ref="imageInput" type="file" name="image" @change="uploadImage" />
        </form>
    </div>
</template>

<script>
import modal from './modal.vue';
import { fetchJson } from '../utils/utils.js';

export default {
    name: 'ItemImage',
    components: {
        modal,
    },
    data() {
        return {
            imageUrl: null,
            uploading: false,
        };
    },
    computed: {
        shown: {
            get() {
                return !!(this.$store.activeItemDialog && this.$store.activeItemDialog.type === 'image');
            },
            set(val) {
                if (!val) this.$store.closeItemDialog();
            },
        },
        item() {
            return this.$store.activeItemDialog && this.$store.activeItemDialog.type === 'image'
                ? this.$store.activeItemDialog.item
                : { image: null, imageUrl: null };
        },
    },
    watch: {
        shown(val) {
            if (val && this.$store.activeItemDialog) {
                this.imageUrl = this.$store.activeItemDialog.item.imageUrl;
            }
        },
    },
    methods: {
        saveImageUrl() {
            this.$store.updateItemImageUrl({ imageUrl: this.imageUrl, item: this.item });
            this.shown = false;
        },
        triggerImageUpload() {
            this.$refs.imageInput.click();
        },
        uploadImage(evt) {
            if (!FormData) {
                alert('Your browser is not supported for file uploads. Please update to a more modern browser.');
                return;
            }
            const file = evt.target.files[0];
            const name = file.name;
            const size = file.size;
            const type = file.type;

            if (name.length < 1) {
                return;
            }
            if (size > 2500000) {
                alert('Please upload a file less than 2.5mb');
                return;
            }
            if (type != 'image/png' && type != 'image/jpg' && !type != 'image/gif' && type != 'image/jpeg') {
                alert('File doesnt match png, jpg or gif.');
                return;
            }
            const formData = new FormData(this.$refs.imageUploadForm);

            this.uploading = true;

            fetchJson('/imageUpload', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
            })
                .then((response) => {
                    this.uploading = false;
                    this.$store.updateItemImage({ image: response.data.id, item: this.item });
                    this.shown = false;
                })
                .catch((_response) => {
                    this.uploading = false;
                    alert('Upload failed! If this issue persists please file a bug.');
                });
        },
        removeItemImage() {
            this.$store.removeItemImage(this.item);
            this.item.image = '';
        },
    },
};
</script>

<style lang="scss"></style>
