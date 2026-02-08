interface StartButtonProps {
  onClick: () => void;
}

export default function StartButton({ onClick }: StartButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-10 py-3 bg-white border-4 border-black
        cursor-pointer hover:bg-gray-100 active:scale-95 transition-all duration-200"
      style={{
        color: '#040000',
        textAlign: 'center',
        fontFamily: '"Just Me Again Down Here", cursive',
        fontSize: '50px',
        fontStyle: 'normal',
        fontWeight: 400,
        lineHeight: '16px',
        filter: 'url(#pencil-border)',
      }}
    >
      start now
    </button>
  );
}
