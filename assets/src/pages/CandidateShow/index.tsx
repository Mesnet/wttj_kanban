import { useCandidate, useColumns, useJob } from '../../hooks'
import { useParams } from "react-router-dom"

import { Text } from "@welcome-ui/text"
import { Flex } from "@welcome-ui/flex"
import { Box } from "@welcome-ui/box"
import CandidateCard from "../../components/Candidate"


function CandidateShow() {
	const { jobId } = useParams()
	const { job } = useJob(jobId)
	const { candidateId } = useParams()
	const { isLoading, candidate } = useCandidate(jobId, candidateId)
	const { columns } = useColumns()

	if (isLoading) {
		return null
	}

	return (
    <>
      <Box backgroundColor="neutral-70" p={20} alignItems="center">
        <Text variant="h5" color="white" m={0}>
          {job?.name}
        </Text>
      </Box>
      <Box p={20}>

          <Flex gap={10} style={{ overflowX: "auto", overflowY: "hidden", whiteSpace: "nowrap", padding: "10px 0" }}>
            {columns && columns.map((column) => (
							<Box
								key={column.id}
								border={1}
								backgroundColor="white"
								borderColor="neutral-30"
								borderRadius="md"
								overflow="hidden"
								style={{
									height: "fit-content",
									minWidth: '300px'
								}}
							>
								<Flex
									p={10}
									borderBottom={1}
									borderColor="neutral-30"
									alignItems="center"
									justify="space-between"
								>
									<Text
										color="black"
										m={0}
										textTransform="capitalize"
									>
										{column.name}
									</Text>
								</Flex>
									<Flex
										direction="column"
										p={10}
										pb={0}
										style={{
											height: '100%',
										}}
									>

										{candidate && candidate.column_id === column.id && (
											<CandidateCard candidate={candidate} />
										)}
									</Flex>
							</Box>
            ))}
          </Flex>
      </Box>
    </>
  )
}

export default CandidateShow
