let success_id = []
let all_data

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function GraphAPI(path, body, ver) {
    return new Promise(callback => {
        let version = ver || require('GraphAPIConfig').adsApiVersion.replace('v', '')
        let request = require('GraphAPI')(version)

        if (body) {
            request
                .path_DO_NOT_USE(path)
                .post(body)
                .then(callback)
                .catch(e => callback({ error: { message: e.toString() } }))
        } else {
            request
                .path_DO_NOT_USE(path)
                .get()
                .then(callback)
                .catch(e => callback({ error: { message: e.toString() } }))
        }
    })
}

async function getAdAccountData(ads_id) {
    return new Promise(resolve => {
        requireLazy(['AdsAccountDataLoader'], async e => {
            let admin_list = e?.getBootstrapData()?._value?.accountUsers
            const FIELDS = [
                'name',
                'owner_business',
                'created_time',
                'insights.date_preset(maximum){spend}',
                'currency',
                'adtrust_dsl',
                'account_status',
                'next_bill_date',
                'adspaymentcycle{threshold_amount}',
                'is_prepay_account',
                'timezone_offset_hours_utc',
                'timezone_name',
                'owner',
                'funding_source_details',
                'users{role}',
                'balance'
            ]

            // Nếu không require được hide admin thì goi

            const HIDE_ADMIN_FIELD = ['userpermissions.limit(500)']

            let fields = (admin_list ? FIELDS : [...FIELDS, ...HIDE_ADMIN_FIELD]).join(',')

            let res = await GraphAPI(`/act_${ads_id}?fields=${fields}&locale=en_US`)

            let isError = res?.error?.message == 'Error: (#200) Provide valid app ID'

            while (isError) {
                res = await GraphAPI(`/act_${ads_id}?fields=${fields}&locale=en_US`)
                if (res.id) {
                    isError = false
                }
                await wait(2000)
            }

            result = { ...res, admin_list }
            return resolve(result)
        })
    })

    // Nếu có hide admin -> Gửi kèm hide admin
}

async function postMsgData(data, id) {
    let target = document.getElementById(id)
    if (target) {
        target.contentWindow.postMessage(
            {
                data,
                from_smit: true,
                id,
                action: 'send-data'
            },
            '*'
        )
    }
    if (success_id.includes(id)) return
    await wait(1000)
    return postMsgData(data, id)
}

async function sendData() {
    requireLazy(['BusinessUnifiedNavigationContext', 'CurrentUserInitialData'], async (e, b) => {
        let ads_id = e.adAccountID || document?.documentElement?.innerHTML?.match(/accountID:"(\d+)"/)?.[1] || null
        let user_id = b.USER_ID

        await getAdAccountData(ads_id).then(e => {
            let data = { ...e, ads_id, user_id }
            all_data = data

            if (location.href.includes('ads/manager/account_settings')) {
                postMsgData(data, 'smit_extended_payment')
            }

            postMsgData(data, 'smit_popup_information')
        })
        return true
    })
}

sendData()

function checkBlockPopup() {
    if (loaded) return
    __d(
        'AdsBrowserExtensionErrorDialogContainer.react',
        ['AdsBrowserExtensionErrorDataProvider', 'AdsBrowserExtensionErrorDialog.react', 'AdsFluxContainer', 'react'],
        function (a, b, c, d, e, f, g) {
            'use strict'

            var h = d('react'),
                i = c('AdsBrowserExtensionErrorDataProvider').toFluxStore()

            a = (function (a) {
                babelHelpers.inheritsLoose(b, a)
                function b() {
                    var b, c
                    for (var d = arguments.length, e = new Array(d), f = 0; f < d; f++) e[f] = arguments[f]
                    return (
                        ((b = c = a.call.apply(a, [this].concat(e)) || this),
                        (c.state = {
                            dismissed: !1,
                            extensionURL: null
                        }),
                        (c.$1 = function () {
                            c.setState({
                                dismissed: !0
                            })
                        }),
                        b) || babelHelpers.assertThisInitialized(c)
                    )
                }
                b.getStores = function () {
                    return [i]
                }
                b.calculateState = function (a) {
                    return {
                        dismissed: a ? a.dismissed : !1,
                        extensionURL: i.getState().extensionURL
                    }
                }
                var d = b.prototype
                d.render = function () {
                    loaded = true
                    return null
                }
                return b
            })(h.Component)
            b = c('AdsFluxContainer').create(a, {
                name: f.id
            })
            g['default'] = b
        },
        98
    )
    return requestAnimationFrame(checkBlockPopup)
}
var loaded = false
checkBlockPopup()

window.addEventListener(
    'message',
    async event => {
        if (event.data.from_smit) {
            switch (event.data.action) {
                case 'rename': {
                    let { name, ads_id } = event.data

                    let res = await GraphAPI(`/act_${ads_id}`, {
                        name,
                        method: 'post'
                    })

                    event.source.postMessage(
                        {
                            from_smit: true,
                            action: 'rename',
                            result: res,
                            name
                        },
                        event.origin
                    )

                    break
                }
                case 'send-data-success': {
                    success_id.push(event.data.id)
                    success = true
                    break
                }
                case 'resend-data': {
                    success_id = []
                    postMsgData(all_data, 'smit_extended_payment')

                    break
                }
            }
        }
    },
    false
)
