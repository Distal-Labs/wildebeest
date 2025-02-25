import { component$ } from '@builder.io/qwik'
import { action$, Form, loader$, useNavigate, z, zod$ } from '@builder.io/qwik-city'
import { getDatabase } from 'wildebeest/backend/src/database'
import { handleRequestGet } from 'wildebeest/functions/api/v1/instance/rules'
import { upsertRule } from 'wildebeest/functions/api/wb/settings/server/rules'
import { TextArea } from '~/components/Settings/TextArea'
import { getErrorHtml } from '~/utils/getErrorHtml/getErrorHtml'

export type ServerSettingsData = { rules: string[] }

export const editAction = action$(
	async (data, { platform }) => {
		let success = false
		try {
			const result = await upsertRule(await getDatabase(platform), {
				id: +data.id,
				text: data.text,
			})
			success = result.success
		} catch (e: unknown) {
			success = false
		}

		return {
			success,
		}
	},
	zod$({
		id: z.string().min(1),
		text: z.string().min(1),
	})
)

export const ruleLoader = loader$<Promise<{ id: number; text: string }>>(async ({ params, platform, html }) => {
	const database = await getDatabase(platform)

	const settingsResp = await handleRequestGet(database)
	let rules: { id: number; text: string }[] = []
	try {
		rules = await settingsResp.json()
	} catch {
		rules = []
	}

	const rule: { id: number; text: string } | undefined = rules.find((r) => r.id === +params['id'])

	if (!rule) {
		throw html(404, getErrorHtml('The selected rule could not be found'))
	}

	return JSON.parse(JSON.stringify(rule))
})

export default component$(() => {
	const rule = ruleLoader()
	const editActionObj = editAction()

	const nav = useNavigate()

	if (editActionObj.value?.success) {
		nav('/settings/server-settings/rules')
	}

	return (
		<>
			<Form action={editActionObj} spaReset>
				<p class="mt-12 mb-9">
					While most claim to have read and agree to the terms of service, usually people do not read through until
					after a problem arises. Make it easier to see your server's rules at a glance by providing them in a flat
					bullet point list. Try to keep individual rules short and simple, but try not to split them up into many
					separate items either.
				</p>

				<input hidden name="id" value={rule.value.id} />

				<div class="mb-12">
					<TextArea
						class="mb-1"
						label="Rule"
						required
						name="text"
						value={rule.value.text}
						description="Describe a rule or requirement for users on this server. Try to keep it short and simple."
					/>
				</div>

				<button
					type="submit"
					class="w-full my-5 bg-wildebeest-vibrant-600 hover:bg-wildebeest-vibrant-500 p-2 text-white text-uppercase border-wildebeest-vibrant-600 text-lg text-semi outline-none border rounded hover:border-wildebeest-vibrant-500 focus:border-wildebeest-vibrant-500"
				>
					Save Changes
				</button>
			</Form>
		</>
	)
})
