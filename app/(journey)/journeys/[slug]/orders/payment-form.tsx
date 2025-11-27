"use client"

/**
 * 付款表單元件（Journey 版本）
 * 包含付款方式選擇、發票資訊、服務契約等
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Building, CreditCard, Smartphone, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface PaymentFormProps {
  orderNo: string
  amount: number
  slug: string
}

type PaymentMethod = "atm" | "credit-card" | "zingala"
type InstallmentPeriod = 3 | 6 | 9 | 12 | 18 | 24
type InvoiceType = "tax-id" | "phone-carrier" | "natural-person" | "donation"

export function PaymentForm({ orderNo, amount, slug }: PaymentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPaying, setIsPaying] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("atm")
  const [installmentPeriod, setInstallmentPeriod] = useState<InstallmentPeriod>(3)
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("tax-id")
  const [invoiceValue, setInvoiceValue] = useState("")
  const [isContractOpen, setIsContractOpen] = useState(false)

  const handlePayment = async () => {
    try {
      setIsPaying(true)

      // 呼叫付款 API
      const res = await fetch(`/api/orders/${orderNo}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        const error = await res.json()
        toast({
          title: "付款失敗",
          description: error.error || "發生未知錯誤",
          variant: "destructive",
        })
        return
      }

      // 付款成功，導向完成頁面
      router.push(`/journeys/${slug}/orders/complete?orderNumber=${orderNo}`)
    } catch (error) {
      console.error("[PaymentForm] 付款錯誤:", error)
      toast({
        title: "付款失敗",
        description: "網路連線錯誤，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 付款說明 */}
      <div>
        <h2 className="text-lg font-bold text-white mb-2">付款說明</h2>
        <p className="text-sm text-slate-300">
          恭喜你，訂單已建立完成，請你於三日內付款。
        </p>
      </div>

      {/* 付款方式 */}
      <div>
        <h2 className="text-lg font-bold text-white mb-2">付款方式</h2>
        <p className="text-sm text-slate-400 mb-4">選取付款方式</p>

        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
          className="space-y-3"
        >
          {/* ATM 匯款 */}
          <div
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
              paymentMethod === "atm"
                ? "border-blue-500 bg-blue-900/20"
                : "border-slate-600 bg-slate-800 hover:border-slate-500"
            )}
            onClick={() => setPaymentMethod("atm")}
          >
            <RadioGroupItem value="atm" id="atm" className="border-slate-400 text-blue-500" />
            <Building className="h-5 w-5 text-slate-400" />
            <Label htmlFor="atm" className="flex-1 cursor-pointer text-white">
              ATM 匯款
            </Label>
          </div>

          {/* 信用卡（一次付清） */}
          <div
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
              paymentMethod === "credit-card"
                ? "border-blue-500 bg-blue-900/20"
                : "border-slate-600 bg-slate-800 hover:border-slate-500"
            )}
            onClick={() => setPaymentMethod("credit-card")}
          >
            <RadioGroupItem value="credit-card" id="credit-card" className="border-slate-400 text-blue-500" />
            <CreditCard className="h-5 w-5 text-slate-400" />
            <Label htmlFor="credit-card" className="flex-1 cursor-pointer text-white">
              信用卡（一次付清）
            </Label>
          </div>

          {/* 銀角零卡分期 */}
          <div
            className={cn(
              "rounded-lg border cursor-pointer transition-colors",
              paymentMethod === "zingala"
                ? "border-blue-500 bg-blue-900/20"
                : "border-slate-600 bg-slate-800 hover:border-slate-500"
            )}
          >
            <div
              className="flex items-center gap-3 p-4"
              onClick={() => setPaymentMethod("zingala")}
            >
              <RadioGroupItem value="zingala" id="zingala" className="border-slate-400 text-blue-500" />
              <Smartphone className="h-5 w-5 text-slate-400" />
              <Label htmlFor="zingala" className="flex-1 cursor-pointer text-white">
                銀角零卡分期
              </Label>
            </div>

            {/* 選取分期 - 僅在選擇銀角零卡時顯示 */}
            {paymentMethod === "zingala" && (
              <div className="px-4 pb-4 pt-0">
                <p className="text-sm text-slate-400 mb-3">選取分期</p>
                <div className="flex flex-wrap gap-2">
                  {([3, 6, 9, 12, 18, 24] as InstallmentPeriod[]).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setInstallmentPeriod(period)}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm transition-colors",
                        installmentPeriod === period
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500"
                      )}
                    >
                      {period}期
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </RadioGroup>

        {/* 銀角零卡說明連結 - 僅在選擇銀角零卡時顯示 */}
        {paymentMethod === "zingala" && (
          <div className="mt-3">
            <Link
              href="https://world.waterballsa.tw/articles/zingala"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
            >
              未使用過銀角零卡？點此前往了解如何申辦
            </Link>
          </div>
        )}
      </div>

      {/* 發票資訊（選填）- 可收合 */}
      <div className="border border-slate-600 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setIsInvoiceOpen(!isInvoiceOpen)}
          className="w-full flex items-center justify-between p-4 text-white hover:bg-slate-700/50 transition-colors"
        >
          <span className="font-medium">發票資訊（選填）</span>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-slate-400 transition-transform",
              isInvoiceOpen && "rotate-180"
            )}
          />
        </button>
        {isInvoiceOpen && (
          <div className="p-4 pt-2 border-t border-slate-600 space-y-4">
            {/* 發票類型 */}
            <div>
              <p className="text-sm text-slate-400 mb-3">發票類型</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setInvoiceType("tax-id"); setInvoiceValue(""); }}
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm transition-colors",
                    invoiceType === "tax-id"
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500"
                  )}
                >
                  統一編號
                </button>
                <button
                  type="button"
                  onClick={() => { setInvoiceType("phone-carrier"); setInvoiceValue(""); }}
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm transition-colors",
                    invoiceType === "phone-carrier"
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500"
                  )}
                >
                  手機載具
                </button>
                <button
                  type="button"
                  onClick={() => { setInvoiceType("natural-person"); setInvoiceValue(""); }}
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm transition-colors",
                    invoiceType === "natural-person"
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500"
                  )}
                >
                  自然人憑證
                </button>
                <button
                  type="button"
                  onClick={() => { setInvoiceType("donation"); setInvoiceValue(""); }}
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm transition-colors",
                    invoiceType === "donation"
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500"
                  )}
                >
                  捐贈碼
                </button>
              </div>
            </div>

            {/* 發票輸入欄位 - 根據選擇的類型顯示對應欄位 */}
            <div>
              <p className="text-sm text-slate-400 mb-2">
                {invoiceType === "tax-id" && "統一編號"}
                {invoiceType === "phone-carrier" && "載具編號"}
                {invoiceType === "natural-person" && "證件編號"}
                {invoiceType === "donation" && "捐贈碼"}
              </p>
              <Input
                type="text"
                value={invoiceValue}
                onChange={(e) => setInvoiceValue(e.target.value)}
                placeholder={
                  invoiceType === "tax-id"
                    ? "例: 12345678"
                    : invoiceType === "phone-carrier"
                    ? "例: /AB12-+"
                    : invoiceType === "natural-person"
                    ? "例: AB12345678901234"
                    : "例: 123"
                }
                maxLength={
                  invoiceType === "tax-id"
                    ? 8
                    : invoiceType === "phone-carrier"
                    ? 8
                    : invoiceType === "natural-person"
                    ? 16
                    : 7
                }
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 進行支付按鈕 */}
      <Button
        onClick={handlePayment}
        disabled={isPaying}
        size="lg"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6"
      >
        {isPaying ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            處理中...
          </>
        ) : (
          "進行支付"
        )}
      </Button>

      {/* 底部說明文字 */}
      <div className="space-y-4 text-sm text-slate-400">
        <p>
          付款後的平日一天內（假日則一至兩天內）會立即幫您對帳，若對帳無誤則會於約定之開學日程為您啟動此帳號的正式使用資格，也會透過訊息來引導您享受此旅程。
        </p>
        <p>
          若您有其他購買相關的問題，歡迎寄信至{" "}
          <a
            href="mailto:sales@waterballsa.tw"
            className="text-blue-400 hover:text-blue-300 hover:underline"
          >
            sales@waterballsa.tw
          </a>{" "}
          詢問。
        </p>
      </div>

      {/* 網際網路課程購買暨服務契約 - 可收合 */}
      <div>
        <button
          type="button"
          onClick={() => setIsContractOpen(!isContractOpen)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ChevronRight
            className={cn(
              "h-5 w-5 transition-transform",
              isContractOpen && "rotate-90"
            )}
          />
          <span className="font-medium">網際網路課程購買暨服務契約</span>
        </button>

        {isContractOpen && (
          <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-600 text-sm text-slate-300 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              <p>
                本網際網路課程購買暨服務契約（以下簡稱本契約），指水球球特務有限公司（以下簡稱「水球球」、「我們」、「我們的」，公司基本資料詳列如下）授權您於 waterballsa.tw 網域之網站或 水球球所有之移動裝置平台（以下合稱本平台），使用水球球透過網際網路連線、或移動裝置平台離線進行之教學、評量或其他相關服務(以下簡稱「本服務」)。爰此，關於本服務之權利義務，雙方同意以本契約約定之。
              </p>

              <div>
                <h4 className="font-bold text-white mb-2">契約審閱期間及當事人基本資料</h4>
                <p className="mb-2">您已審閱本契約全部條款內容超過 3 日以上。</p>
                <p className="mb-2">您，即於本平台經下列程序與 水球球 成功締約者（以下簡稱會員），個人資料及已購課程清單詳細皆載明於您的會員頁面。</p>
                <ul className="list-none space-y-1 ml-0">
                  <li>水球球特務有限公司（ 水球球 ）負責人：潘冠辰</li>
                  <li>客戶服務電子郵件：support＠waterballsa.tw</li>
                  <li>營業所地址：臺北市大安區和安里復興南路一段 352 號 2 樓之 2</li>
                  <li>統一編號：00117764</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">本服務內容</h4>
                <p className="mb-2">本服務內容包括下列各款：</p>
                <ul className="list-none space-y-1 ml-0">
                  <li>水球球 提供本服務之網站：waterballsa.tw</li>
                  <li>水球球 提供本服務之適用對象：不限</li>
                  <li>水球球 提供本服務之教學內容：軟體設計模式精通之旅</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">設備規格</h4>
                <p className="mb-2">為締造您使用本服務之良好體驗，您的電腦或手機應具備課程頁面建議及下表所列之軟硬體設備基本規格及要求，若您的設備暫無法滿足前述基本規格及要求，您明白可能會造成無法使用本服務或影響本服務之品質：</p>
                <p className="mb-1">作業系統：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>電腦：Windows 10、Mac OS 10.13</li>
                  <li>手機：iOS 14、Android 7</li>
                  <li>瀏覽器：Chrome 75、Firefox 68</li>
                  <li>網路速度：光纖網路 2M、行動網路 4G</li>
                </ul>
                <p className="mt-2">您連結 水球球 指定網站系統之機房設備之接取網路，除經雙方約定由 水球球 所提供者外，應由您自行向合法經營之電信事業申請租用，您租用該接取網路所生之權利義務，依您與該電信事業間契約約定之。</p>
                <p className="mt-2">若我們未事先告知如第 3.1 條之約定，致您無法使用本服務或影響本服務之品質者，您得主張本契約不生效力。</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">契約之成立生效</h4>
                <p className="mb-2">您經由網際網路購買本服務者，於 水球球 所指定之網頁上「建立訂單」，在付款、及發送付款通知信之後，即表示同意購買本服務並同意以電子文件作為表示方式後， 水球球 將立即以本平台的再確認機制供您確認電子文件內容，經您再次確認後，本契約成立、生效。</p>
                <p>除前項情形外，經雙方於本契約書上簽名或蓋章後，本契約成立。</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">法定代理人</h4>
                <p className="mb-2">您若為限制行為能力人者，本契約之訂定，應經您的法定代理人同意，本契約始生效力；您若為無行為能力人者，本契約應由您的法定代理人代理訂定。</p>
                <p className="mb-2">違反前項之約定者，除有民法第八十三條之情形者外，本契約不生效力， 水球球 不得據以要求您的法定代理人負擔契約履行或賠償責任。</p>
                <p>限制行為能力人於訂立本契約條款前，應主動告知其為限制行為能力人</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">課程提供與服務期間</h4>
                <p className="mb-2">水球球 授權您使用本服務之期間、次數或權利依下列之約定：</p>
                <p>◼定期制：您於收受 水球球 提供使用本服務所需之開課日當日起，為期_半年_之使用期間。 您於上述期間內得不計次數、每次不計時間使用本服務。此外，當您於依本契約合法購買本課程（內容）後，於未違反本契約或相關法規規定之前提下，水球球將持續提供本平台之服務。</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">擔保授權</h4>
                <p className="mb-2">水球球 應確保其就本契約所授權您使用之服務內容，為合法權利人。</p>
                <p className="mb-2">水球球 有違反前項之情事致您無法繼續使用者， 水球球 將賠償您無法使用之損失，賠償以替換類似課程或全額退還該課程您所支付之授權使用費金額為限。</p>
                <p>未經 水球球 事前之書面同意，嚴格禁止您將使用本服務之權利讓與他人，包括但不限於與他人共用您的會員帳號、分享串流、公開放映或轉售課程兌換券、折價券等。</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">授權使用費</h4>
                <p className="mb-2">本服務授權使用費之金額如已購內容清單所記載。</p>
                <p className="mb-2">水球球 得以優惠價格提供您自由決定是否加價購買商品、教學課程或服務。</p>
                <p className="mb-2">您依前項優惠方式加價購買之教學課程或服務，契約終止時準用第 16 條第 2 項之規定。</p>
                <p className="mb-2">訂立本契約時， 水球球 以「贈品」為名義，向您所為之贈與，於本契約終止或解除時， 水球球 不會向您請求返還該贈品，亦不會向您主張應自返還之費用金額當中，扣除該贈品之價額。 水球球 以贈送教學課程數量、使用期限為內容而簽訂契約者，亦同。</p>
                <p>前項「贈品」，其價值之上限為教學課程或服務價值之二分之一。</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">付款方式</h4>
                <p>◼雙方同意本服務授權使用費之給付方式為一次全部繳納。</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">授權使用原則</h4>
                <p className="mb-2">您如有下列情形之一者，由您自負一切法律責任， 水球球 並得於發現下列情事時通知您立即終止本契約，您不得拒絕：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>您蓄意散布干擾 本平台系統正常運作之電腦程式，或對於本平台進行包括但不限於修改、重製、對於任何功能、程式進行還原工程 （reverse engineering）、反向組譯（disassemble）或任何企圖取得原始碼或內容之行為等。</li>
                  <li>您在本平台上散布恐嚇、毀謗、侵害他人隱私、色情或其他違反強制或禁止規定、公序良俗之文字、圖片或影像。</li>
                </ul>
                <p className="mt-2">於前項情形及第 7.3條、第 11.7 條等情形者，水球球 有權自行認定並立即停止傳輸（下架）任何前述內容並採取相應行動， 包括但不限於暫停您使用本服務之全部或部分、移除該內容或保存有關記錄等。</p>
                <p className="mt-2">您利用本平台從事其他不法或違反本契約約定事項之行為，其情節重大，且經 水球球 通知您限期 3 日改正而屆期未改正或無法改正者， 水球球 得通知您立即終止本契約，您不得拒絕。</p>
                <p className="mt-2">水球球 依本條第 1 項及第 3 項之約定終止本契約者，準用第 16 條之規定。</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">您的義務</h4>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>您對於使用本服務所產生之授權使用費，有給付之義務。</li>
                  <li>您對於您的會員帳號與個人密碼有妥善保管以避免第三人知悉之義務。</li>
                  <li>您在使用本服務時，有遵守本契約所約定之授權使用原則之義務。</li>
                  <li>您依本契約之約定所註冊之個人資料有錯誤或已變更者，應儘速通知 水球球 請求更正。如因您怠於通知而致其權益受損者，應由您自行負責。</li>
                  <li>您應提供並持續保持所有建立該帳號之個人資料之真實性及完整性，所有的個人資料皆被視為註冊必備要素，如建立帳號時提供之個人資料有虛偽不實或不完整之情事，應視為違反本契約。</li>
                  <li>您應為其使會員帳號登入系統後所進行之一切活動、行為負責，包括但不限於衍生之相關費用。</li>
                  <li>您不得重製、公開傳輸、轉售、公開播放、分享、以本平台以外之方式下載或使用本服務。</li>
                  <li>您於本同意書有效期間內或終止後，均不得有任何惡意損害 水球球 商譽之行為。</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">帳號密碼非法使用之處理</h4>
                <p className="mb-2">使用您的會員帳號與個人密碼，登入本平台之行為，推定為您的行為。</p>
                <p>若您發現您的會員帳號或個人密碼遭第三人不法或不當之使用者，應立即通知我們。經您確認有遭第三人不法或不當之使用情事者， 我們將立即暫停該會員帳號或個人密碼之使用，並接受您更換會員帳號或個人密碼。</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">服務品質</h4>
                <p className="mb-2">水球球 應提供具有可合理期待安全性之服務，並應確保其系統設備，無發生錯誤、畫面暫停、遲滯、中斷或不能進行連線之情形。</p>
                <p className="mb-2">水球球 因可歸責於自己之事由，違反前項之約定者，應立即於 48 小時內更正或修復之。</p>
                <p className="mb-2">您明白 水球球 平台上之課程由各授課老師提供，水球球 盡力要求老師們所提供之教學內容或教材之正確性，經您通知知悉課程或教材內容可能有錯誤，我們將協助您與授課老師確認內容，並於通知或知悉之日起算 3 個工作日內完成與授課老師之初步確認。</p>
                <p className="mb-2">您使用本服務時，若發生情節重大之系統異常或教學內容、教材錯誤之情事達 3 次以上，經您立即通知 水球球 且 水球球 未依規定修復或更正，您得通知 水球球 逕行終止本契約， 水球球 不得拒絕， 水球球 並應準用第16條返還您本服務授權使用費。</p>
                <p className="mb-2">您使用本服務時，因可歸責於 水球球 所合作之第三人之事由，發生教學內容錯誤、網站系統畫面暫停、中斷、不能進行連線或其他服務品質瑕疵之情形，水球球 將立即更正或修復之。</p>
                <p className="mb-2">水球球 不保證以下事項：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>本服務將符合您的特定要求</li>
                  <li>於 水球球 購買或取得之任何產品、服務、資訊或其它課程將符合您的期望，對此是否使用本服務應由您自行考慮且自負風險。</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">暫停服務之處理</h4>
                <p className="mb-2">水球球 對於本服務相關軟硬體設備，進行營運上必要之搬遷、更換、升級、保養或維修時，得暫停本服務之全部或一部。</p>
                <p>水球球 因前項事由而暫停本服務之全部或一部，應於暫停本服務 3 日前，於本服務網站首頁上及本服務進行中公告，並以電子郵件通知您。但因臨時性、急迫性或不可歸責於 水球球 之事由者，不在此限。</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">契約之變更</h4>
                <p className="mb-2">水球球 修改本契約時，應於 30 日前於本平台公告之，同時以電子郵件通知您。</p>
                <p className="mb-2">您未為反對之表示且繼續使用本服務者， 水球球 依契約變更後之內容繼續提供本服務。</p>
                <p>您不同意第1項之變更，得於公告後三十日內向 水球球 主張終止契約。 水球球 應準用第 16 條約定返還您部分本服務授權使用費金額，金額為服務期間剩餘月數 x (授權使用費金額 / 完整使用期間之月數)。</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">終止契約與退費</h4>
                <p className="mb-2">您於下列情形，且您或您購買課程時所指定之人，未觀看指定試看課程單元或特定預覽部份以外之課程內容者，得通知 水球球 終止契約，除有正當理由外， 水球球 不得拒絕：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>開課日後，合約生效日起 7 日內終止合約，應全額退還該課程您所支付之授權使用費金額。</li>
                  <li>開課日後，合約生效日起第 15 日終止合約者，該課程您所支付之授權使用費金額不予退還。</li>
                </ul>
                <p className="mt-2">契約終止後， 水球球 應依前項之方式，結算、撥付本服務之授權使用費。</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">申訴權利</h4>
                <p>您對於 水球球 所提供之本服務，得以電子郵件或書面，向 水球球 提出申訴，水球球 應自接獲您申訴之日起 15 日內妥適處理之。</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">損害賠償責任</h4>
                <p>您擔保如 水球球集團及其管理階層、董事、員工、代理人及承包商因 a) 該您所發布或遞交之內容 b) 您使用 本平台 c) 您違反本契約及 d) 您使用本平台時侵犯第三人之任何權利，而產生之各樣主張、要求，從而受有損失、須負擔責任、損害賠償或支出（包括但不限於合理的律師費用），您同意賠償。</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">契約之附件</h4>
                <p className="mb-2">有關本契約之附件均為本契約之一部分。</p>
                <p className="mb-2">前項附件之內容，如有與本契約條款內容相牴觸者，應為有利於您之適用。</p>
                <p>本契約成立時， 水球球 會將本契約及相關附件，提供您下載、列印儲存。</p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">管轄法院</h4>
                <p>因本契約所生之一切爭議，雙方當事人同意以臺灣臺北地方法院為第一審管轄法院，但不得排除消費者保護法第四十七條或民事訴訟法第四百三十六條之九有關小額訴訟管轄法院之適用。</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
