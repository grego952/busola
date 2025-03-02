import { render } from '@testing-library/react';
import { CopiableText } from 'shared/components/CopiableText/CopiableText';
import copyToClipboard from 'copy-to-clipboard';
import '@ui5/webcomponents-icons/dist/AllIcons.js';

vi.mock('copy-to-clipboard');

vi.mock('@ui5/webcomponents-react', () => {
  return {
    Button: props => <button {...props}>{props.children}</button>,
  };
});

describe('CopiableText', () => {
  it('renders the text', () => {
    const text = 'abcd und 123456';
    const { queryByText } = render(<CopiableText textToCopy={text} />);

    expect(queryByText(text)).toBeInTheDocument();
  });

  it('renders custom caption', () => {
    const text = 'abcd und 123456';
    const caption = <p>Copiable</p>;
    const { queryByText } = render(
      <CopiableText textToCopy={text}>{caption}</CopiableText>,
    );
    expect(queryByText('Copiable')).toBeInTheDocument();
  });

  it('copies text to clipboard whe button is clicked', () => {
    const text = 'abcd und 123456';
    const { container } = render(<CopiableText textToCopy={text} />);

    container.querySelector('button').click();

    expect(copyToClipboard).toHaveBeenCalledWith(text);
  });
});
