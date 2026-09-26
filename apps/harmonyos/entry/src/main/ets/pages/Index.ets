import web_webview from '@ohos.web.webview';

@Entry
@Component
struct Index {
  private controller: web_webview.WebviewController = new web_webview.WebviewController();

  build() {
    Column() {
      Web({
        src: 'https://nma82439668hhf.github.io/ielts-passport/',
        controller: this.controller
      })
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .onlineImageAccess(true)
        .mediaPlayGestureAccess(true)
        .width('100%')
        .height('100%')
    }
    .width('100%')
    .height('100%')
  }
}
