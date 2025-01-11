import React, { useState } from "react";
import { Box } from "@welcome-ui/box";
import { Flex } from "@welcome-ui/flex";
import { Text } from "@welcome-ui/text";
import { Button } from "@welcome-ui/button";
import { InputText } from "@welcome-ui/input-text";

interface NewColumnProps {
  onAddColumn: (columnName: string) => void;
}

const NewColumn: React.FC<NewColumnProps> = ({ onAddColumn }) => {
  const [newColumnName, setNewColumnName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!newColumnName.trim()) return;
    onAddColumn(newColumnName.trim());
    setNewColumnName("");
    setIsAdding(false);
  };

  return (
    <Box
      w={300}
      border={1}
      backgroundColor="neutral-10"
      borderColor="neutral-30"
      borderRadius="md"
      overflow="hidden"
			style={{
				height: "fit-content",
        minWidth: '300px'
			}}
    >
      {isAdding ? (
        <Box p={10}>
					<InputText
						placeholder="Enter column name"
						value={newColumnName}
						onChange={(e) => setNewColumnName(e.target.value)}
						style={{
							marginBottom: "10px"
						}}
					>
					</InputText>

          <Flex justifyContent="space-between">
						<Button onClick={handleAdd} variant="primary" disabled={!newColumnName.trim()}>
							Add a list
						</Button>

            <Button onClick={() => setIsAdding(false)} variant="ghost">
							&times;
            </Button>

          </Flex>
        </Box>
      ) : (
        <Flex
          p={10}
          alignItems="center"
          justifyContent="center"
          style={{ cursor: "pointer" }}
          onClick={() => setIsAdding(true)}
        >
          <Text color="neutral-500">
            + Add Column
          </Text>
        </Flex>
      )}
    </Box>
  );
};

export default NewColumn;
