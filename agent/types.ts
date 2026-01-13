export interface RenderedNode {
    
  tag: string;
  text: string;

  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  styles: {
    display: string;
    position: string;
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    padding: string;
    margin: string;
    borderRadius: string;
  };

  children: RenderedNode[];
  id?: string;
  className?: string;
  role: string | undefined;
  ariaLabel: string | undefined,
}
