## Assets folder

this folder is copied in production build

Don't import anything from it.

If you want to import some asset - place it in `src/ui/assets`, otherwise file will be copied in production build *and* processed with webpack file-loader, it means duplicated file will be in production build.

Assets from these folder used in CSS, manifest.json where webpack can't handle them
