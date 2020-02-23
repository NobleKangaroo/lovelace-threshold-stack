threshold-stack
===============
Dynamically stack cards horizontally or vertically, depending on device width

![Xtbds4CJg4](https://user-images.githubusercontent.com/34781835/75109445-3b625200-55f1-11ea-83d7-5d234badb5f1.gif)

### Installation
Install `threshold-stack.js` as a `module`.
```yaml
resources:
  - url: /local/threshold-stack.js
    type: module
```

### Usage
```yaml
type: custom:threshold-stack
threshold: <pixels>px
cards:
  ...
```
If the device is at least `pixels` pixels wide, `cards` will be displayed as a `horizontal-stack`.  
If the device is less than `pixels` pixels wide, `cards` will be displayed as a `vertical-stack`.

### Options
- `threshold` Threshold in pixels for `horizontal-stack`. Default: `600px`
- `cards` **Required** Cards to render; works particularly well as a `vertical-stack` container
