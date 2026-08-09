import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FundingStrip } from './FundingStrip';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe('FundingStrip', () => {
	it('shows the EU flag, the funding statement and the grant disclaimer', () => {
		render(<FundingStrip />);

		expect(screen.queryByAltText('layout.funding.flagAlt')).not.toBeNull();
		expect(screen.queryByText('layout.funding.title')).not.toBeNull();
		expect(screen.queryByText('layout.funding.disclaimer')).not.toBeNull();
	});

	it('drops the disclaimer below md, keeping flag and statement at every width', () => {
		render(<FundingStrip />);

		const disclaimer = screen.getByText('layout.funding.disclaimer');
		expect(disclaimer.className).toContain('hidden');
		expect(disclaimer.className).toContain('md:block');

		expect(screen.getByText('layout.funding.title').className).not.toContain('hidden');
	});

	it('scales the flag, the statement and the padding down below md', () => {
		const { container } = render(<FundingStrip />);

		expect(container.firstElementChild?.className).toContain('py-3');
		expect(container.firstElementChild?.className).toContain('md:py-5');

		const flag = screen.getByAltText('layout.funding.flagAlt');
		expect(flag.className).toContain('w-16');
		expect(flag.className).toContain('md:w-[100px]');

		const title = screen.getByText('layout.funding.title');
		expect(title.className).toContain('text-[17px]');
		expect(title.className).toContain('md:text-[20px]');
	});
});
