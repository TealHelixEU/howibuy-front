interface PageTitleBandProps {
	eyebrow: string;
	title: string;
}

/**
 * The band beneath the top bar, carrying the page title over the brand gradient. The
 * eyebrow is an oversized, barely-there watermark, and stays uncondensed while the
 * title takes the condensed heading face.
 */
export function PageTitleBand({ eyebrow, title }: PageTitleBandProps) {
	return (
		<div className="relative overflow-hidden title-band">
			<span aria-hidden="true" className="pointer-events-none absolute inset-0 title-band-pattern" />
			<div className="relative site-column py-6">
				<p className="text-[40px] leading-none font-black tracking-[1px] text-brand-green/10 uppercase">
					{eyebrow}
				</p>
				<h1 className="my-0 text-[34px] text-brand-off-white [text-shadow:0.05em_0.05em_0_#0e4c6d]">{title}</h1>
			</div>
		</div>
	);
}
