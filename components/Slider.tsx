import * as React from "react";

interface ButtonProps {
    id: number;
    label: string;
    selected: boolean;
    select: (id: number) => void;
  }

const Button : React.FC<ButtonProps> = ({id, label, selected, select}) => {
  return (
    <div onClick={() => select(id)} className={`justify-center px-11 py-5 mt-1 rounded-xl max-md:px-5 ${selected ? "text-gray-900 bg-white shadow-sm" : ""}`}>
      {label}
    </div>
  );
};

const buttons = [
  { id: 1, label: "Buy Energy"  },
  { id: 2, label: "Sell Energy" },
  { id: 3, label: "View Orders" },
  { id: 4, label: "Claim Eth" }
];

interface SliderProps {
    selected: number;
    setSelected: (id: number) => void;
}

const Slider: React.FC<SliderProps> = ({selected, setSelected}) => {

  return (
    <div className="flex justify-center items-center gap-1.5 px-1.5 text-sm font-medium leading-4 text-center text-gray-500 bg-blue-50 rounded-xl max-md:flex-wrap">
      {buttons.map((button) => (
        <Button key={button.id} id={button.id} label={button.label} selected={selected == button.id} select={() => setSelected(button.id)} />
      ))}
    </div>
  );
};

export default Slider;